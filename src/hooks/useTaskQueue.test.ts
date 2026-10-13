import { describe, it, expect, beforeEach } from 'vitest';

// Test the queue, coordination, and error-recovery logic used in useTasks.
// Since useTasks depends on Apollo and React hooks, we extract the queue
// logic into a standalone simulation that mirrors the ref-based promise chain.

type MutationResult = { success: true } | { success: false; error: string };

function createQueue() {
  let queue = Promise.resolve<MutationResult>({ success: true });
  let isDeleting = false;

  return {
    get isDeleting() {
      return isDeleting;
    },
    enqueueMove(
      mutation: () => Promise<void>,
      refetch: () => Promise<void>,
    ): Promise<MutationResult> {
      if (isDeleting) {
        return Promise.resolve({ success: false, error: 'delete in progress' });
      }
      const op = queue.then(async (): Promise<MutationResult> => {
        try {
          if (isDeleting) return { success: false, error: 'delete in progress' };
          await mutation();
          try { await refetch(); } catch { /* refetch error swallowed */ }
          return { success: true };
        } catch {
          return { success: false, error: 'mutation failed' };
        }
      });
      queue = op;
      return op;
    },
    enqueueDelete(deleteFn: () => Promise<MutationResult>): Promise<MutationResult> {
      isDeleting = true;
      const op = queue.then(async (): Promise<MutationResult> => {
        try {
          return await deleteFn();
        } finally {
          isDeleting = false;
        }
      });
      queue = op;
      return op;
    },
  };
}

describe('drag queue', () => {
  let q: ReturnType<typeof createQueue>;
  beforeEach(() => { q = createQueue(); });

  it('serializes concurrent move operations', async () => {
    const order: number[] = [];
    const move1 = q.enqueueMove(
      async () => { order.push(1); },
      async () => {},
    );
    const move2 = q.enqueueMove(
      async () => { order.push(2); },
      async () => {},
    );
    await Promise.all([move1, move2]);
    expect(order).toEqual([1, 2]);
  });

  it('continues the queue after a move mutation fails', async () => {
    const result1 = q.enqueueMove(
      async () => { throw new Error('network error'); },
      async () => {},
    );
    const result2 = q.enqueueMove(
      async () => {},
      async () => {},
    );
    const [r1, r2] = await Promise.all([result1, result2]);
    expect(r1.success).toBe(false);
    expect(r2.success).toBe(true);
  });

  it('continues the queue after refetch fails', async () => {
    const result1 = q.enqueueMove(
      async () => {},
      async () => { throw new Error('refetch failed'); },
    );
    const result2 = q.enqueueMove(
      async () => {},
      async () => {},
    );
    const [r1, r2] = await Promise.all([result1, result2]);
    // First move succeeded (mutation worked, refetch error swallowed)
    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
  });

  it('blocks moves while a delete is in progress', async () => {
    let resolveDelete: () => void;
    const deletePromise = new Promise<void>((r) => { resolveDelete = r; });

    const deleteResult = q.enqueueDelete(async () => {
      await deletePromise;
      return { success: true } as MutationResult;
    });

    // Move enqueued while delete is pending
    const moveResult = q.enqueueMove(
      async () => {},
      async () => {},
    );

    // Move should be rejected immediately (before delete finishes)
    const mr = await moveResult;
    expect(mr.success).toBe(false);
    expect('error' in mr && mr.error).toContain('delete');

    // Finish the delete
    resolveDelete!();
    const dr = await deleteResult;
    expect(dr.success).toBe(true);
  });

  it('allows moves after delete completes', async () => {
    await q.enqueueDelete(async () => ({ success: true } as MutationResult));
    expect(q.isDeleting).toBe(false);

    const result = await q.enqueueMove(
      async () => {},
      async () => {},
    );
    expect(result.success).toBe(true);
  });

  it('skips a queued move when delete is requested before it executes', async () => {
    const order: string[] = [];
    const move = q.enqueueMove(
      async () => { order.push('move'); },
      async () => {},
    );
    const del = q.enqueueDelete(async () => {
      order.push('delete');
      return { success: true } as MutationResult;
    });
    const [mr, dr] = await Promise.all([move, del]);
    // Delete flag was set before the move ran, so the move is skipped
    expect(mr.success).toBe(false);
    expect(dr.success).toBe(true);
    expect(order).toEqual(['delete']);
  });

  it('runs move then delete when move completes before delete is enqueued', async () => {
    const order: string[] = [];
    // First complete a move
    await q.enqueueMove(
      async () => { order.push('move'); },
      async () => {},
    );
    // Then enqueue a delete
    await q.enqueueDelete(async () => {
      order.push('delete');
      return { success: true } as MutationResult;
    });
    expect(order).toEqual(['move', 'delete']);
  });
});

describe('optimistic state recovery', () => {
  it('pending move count tracks concurrent moves correctly', async () => {
    let pendingCount = 0;

    async function simulateMove(succeed: boolean) {
      pendingCount++;
      try {
        if (!succeed) throw new Error('fail');
      } finally {
        pendingCount--;
      }
    }

    await simulateMove(true);
    expect(pendingCount).toBe(0);

    // Two concurrent moves
    pendingCount = 0;
    const m1 = simulateMove(true);
    const m2 = simulateMove(false).catch(() => {});
    await Promise.allSettled([m1, m2]);
    expect(pendingCount).toBe(0);
  });

  it('only clears optimistic state when all pending operations complete', async () => {
    let optimistic: string | null = null;
    let pendingCount = 0;

    async function simulateMove(label: string, delay: number) {
      pendingCount++;
      optimistic = label;
      await new Promise((r) => setTimeout(r, delay));
      pendingCount--;
      if (pendingCount === 0) optimistic = null;
    }

    const m1 = simulateMove('move-1', 50);
    const m2 = simulateMove('move-2', 100);

    // After m1 completes, optimistic should still be active because m2 is pending
    await m1;
    expect(optimistic).not.toBeNull();

    await m2;
    expect(optimistic).toBeNull();
  });
});
