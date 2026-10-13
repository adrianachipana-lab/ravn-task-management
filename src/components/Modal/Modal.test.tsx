import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal';

describe('Modal', () => {
  it('renders children when open', () => {
    render(
      <Modal isOpen onClose={vi.fn()}>
        <p>Modal content</p>
      </Modal>,
    );
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()}>
        <p>Hidden content</p>
      </Modal>,
    );
    expect(screen.queryByText('Hidden content')).not.toBeInTheDocument();
  });

  it('calls onClose when Escape is pressed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose}>
        <p>Content</p>
      </Modal>,
    );

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when clicking the backdrop', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = render(
      <Modal isOpen onClose={onClose}>
        <p>Content</p>
      </Modal>,
    );

    // Click on the dialog element itself (backdrop area)
    const dialog = container.querySelector('dialog')!;
    await user.click(dialog);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does NOT close when clicking inside the dialog content', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose}>
        <p>Click me</p>
      </Modal>,
    );

    await user.click(screen.getByText('Click me'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('locks body scroll when open', () => {
    render(
      <Modal isOpen onClose={vi.fn()}>
        <p>Content</p>
      </Modal>,
    );
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body scroll when closed', () => {
    const { rerender } = render(
      <Modal isOpen onClose={vi.fn()}>
        <p>Content</p>
      </Modal>,
    );
    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <Modal isOpen={false} onClose={vi.fn()}>
        <p>Content</p>
      </Modal>,
    );
    expect(document.body.style.overflow).toBe('');
  });

  it('renders a dialog element with aria-label and aria-modal', () => {
    render(
      <Modal isOpen onClose={vi.fn()}>
        <p>Content</p>
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-label', 'Task dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('accepts a custom aria-label', () => {
    render(
      <Modal isOpen onClose={vi.fn()} ariaLabel="Create task">
        <p>Content</p>
      </Modal>,
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Create task');
  });
});
