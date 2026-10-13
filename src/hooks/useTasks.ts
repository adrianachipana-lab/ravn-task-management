import { useCallback, useMemo, useRef } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import type { Task, CreateTaskInput, UpdateTaskInput } from '../types/task';
import { useFilters } from './useFilters';
import { GET_TASKS } from '../graphql/queries';
import { CREATE_TASK, UPDATE_TASK, DELETE_TASK } from '../graphql/mutations';
import { formatDateInputValue } from '../utils/date';

type TaskQueryInput = Partial<
  Pick<CreateTaskInput, 'name' | 'status' | 'tags' | 'pointEstimate'> & { assigneeId: string }
>;

export type TaskMutationResult = { success: true } | { success: false; error: string };

function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export function useTasks() {
  const { filters } = useFilters();

  // Note: dueDate is filtered client-side because the API requires an exact timestamp match
  const apiInput = useMemo(() => {
    const input: TaskQueryInput = {};
    if (filters.status) input.status = filters.status;
    if (filters.tags && filters.tags.length > 0) input.tags = filters.tags;
    if (filters.pointEstimate) input.pointEstimate = filters.pointEstimate;
    if (filters.assigneeId) input.assigneeId = filters.assigneeId;
    if (filters.name) input.name = filters.name;
    return input;
  }, [filters]);

  const { data, loading, error, refetch } = useQuery<{ tasks: Task[] }>(GET_TASKS, {
    variables: { input: apiInput },
    fetchPolicy: 'cache-and-network',
  });

  const tasks = useMemo(() => {
    const all = data?.tasks ?? [];
    if (!filters.dueDate) return all;
    return all.filter((task) => formatDateInputValue(task.dueDate) === filters.dueDate);
  }, [data?.tasks, filters.dueDate]);

  const [createTaskMutation] = useMutation(CREATE_TASK);
  const createTask = useCallback(
    async (input: CreateTaskInput): Promise<TaskMutationResult> => {
      try {
        await createTaskMutation({
          variables: {
            input: {
              name: input.name,
              status: input.status,
              dueDate: input.dueDate,
              pointEstimate: input.pointEstimate,
              tags: input.tags,
              assigneeId: input.assigneeId || undefined,
            },
          },
          refetchQueries: [{ query: GET_TASKS, variables: { input: apiInput } }],
        });
        return { success: true as const };
      } catch (err) {
        return { success: false, error: getErrorMessage(err, 'Failed to create task') };
      }
    },
    [createTaskMutation, apiInput],
  );

  const [updateTaskMutation] = useMutation(UPDATE_TASK);
  const runUpdateTaskMutation = useCallback(
    (input: UpdateTaskInput) => {
      const variables: UpdateTaskInput = { id: input.id };
      if (input.name !== undefined) variables.name = input.name;
      if (input.status !== undefined) variables.status = input.status;
      if (input.dueDate !== undefined) variables.dueDate = input.dueDate;
      if (input.pointEstimate !== undefined) variables.pointEstimate = input.pointEstimate;
      if (input.tags !== undefined) variables.tags = input.tags;
      if (input.position !== undefined) variables.position = input.position;
      if (input.assigneeId) variables.assigneeId = input.assigneeId;

      return updateTaskMutation({ variables: { input: variables } });
    },
    [updateTaskMutation],
  );

  // Drag queue: serializes drag mutations and coordinates with deletes.
  // Every operation chains off the previous one so they never overlap.
  // The queue promise always resolves (never rejects) to keep the chain alive.
  const dragQueueRef = useRef(Promise.resolve<TaskMutationResult>({ success: true }));
  const isDeletingRef = useRef(false);

  // --- deleteTask must be declared before safeDeleteTask ---
  const [deleteTaskMutation] = useMutation(DELETE_TASK);
  const deleteTask = useCallback(
    async (taskId: string): Promise<TaskMutationResult> => {
      try {
        await deleteTaskMutation({
          variables: { input: { id: taskId } },
          update(cache) {
            cache.modify({
              fields: {
                tasks(existing: readonly { __ref: string }[] = [], { readField }) {
                  return existing.filter((ref) => readField('id', ref) !== taskId);
                },
              },
            });
          },
        });
        return { success: true as const };
      } catch (err) {
        return { success: false, error: getErrorMessage(err, 'Failed to delete task') };
      }
    },
    [deleteTaskMutation],
  );

  const updateTask = useCallback(
    async (input: UpdateTaskInput): Promise<TaskMutationResult> => {
      try {
        // Wait for pending drag/delete operations before editing
        await dragQueueRef.current;
        await runUpdateTaskMutation(input);
        await refetch();
        return { success: true as const };
      } catch (err) {
        return { success: false, error: getErrorMessage(err, 'Failed to update task') };
      }
    },
    [runUpdateTaskMutation, refetch],
  );

  const updateTasks = useCallback(
    (inputs: UpdateTaskInput[]): Promise<TaskMutationResult> => {
      if (isDeletingRef.current) {
        return Promise.resolve({
          success: false,
          error: 'Cannot move tasks while a delete is in progress',
        });
      }
      const operation = dragQueueRef.current.then(
        async (): Promise<TaskMutationResult> => {
          try {
            if (isDeletingRef.current) {
              return {
                success: false,
                error: 'Cannot move tasks while a delete is in progress',
              };
            }
            const settled = await Promise.allSettled(
              inputs.map((input) => runUpdateTaskMutation(input)),
            );
            const failures = settled.filter((r) => r.status === 'rejected');
            try {
              await refetch();
            } catch {
              // Refetch failure must not break the queue
            }
            if (failures.length > 0) {
              return {
                success: false,
                error: `${failures.length} of ${inputs.length} updates failed`,
              };
            }
            return { success: true as const };
          } catch {
            return { success: false, error: 'Failed to update tasks' };
          }
        },
      );
      dragQueueRef.current = operation;
      return operation;
    },
    [runUpdateTaskMutation, refetch],
  );

  // Delete goes through the queue so new moves wait for it to finish
  const safeDeleteTask = useCallback(
    (taskId: string): Promise<TaskMutationResult> => {
      isDeletingRef.current = true;
      const operation = dragQueueRef.current.then(
        async (): Promise<TaskMutationResult> => {
          try {
            return await deleteTask(taskId);
          } finally {
            isDeletingRef.current = false;
          }
        },
      );
      dragQueueRef.current = operation;
      return operation;
    },
    [deleteTask],
  );

  return {
    tasks,
    loading,
    error: error?.message ?? null,
    createTask,
    updateTask,
    updateTasks,
    deleteTask: safeDeleteTask,
  };
}
