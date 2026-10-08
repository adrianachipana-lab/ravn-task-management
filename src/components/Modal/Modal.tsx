import { useEffect, useRef, useCallback } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  overlayClassName?: string;
  dialogClassName?: string;
  ariaLabel?: string;
}

// Reusable modal dialog using <dialog>.showModal() for native focus trap and semantics
// Closes on Escape key (native) or clicking the backdrop
// Locks body scroll while open to prevent background scrolling
export function Modal({
  isOpen,
  onClose,
  children,
  overlayClassName,
  dialogClassName,
  ariaLabel = 'Task dialog',
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const stableClose = useCallback(() => {
    onCloseRef.current();
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      // showModal() provides native focus trap, ::backdrop, and aria-modal
      if (!dialog.open) {
        if (typeof dialog.showModal === 'function') {
          try {
            dialog.showModal();
          } catch {
            // jsdom doesn't fully support showModal
          }
        }
        // Ensure open attribute is set (showModal sets it in browsers, but not in jsdom)
        if (!dialog.open) dialog.setAttribute('open', '');
      }
      document.body.style.overflow = 'hidden';
    } else if (dialog.open) {
      dialog.close();
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle native cancel event (Escape key when using showModal)
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      stableClose();
    };

    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [stableClose]);

  // Fallback Escape handler for environments without native dialog (jsdom)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') stableClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, stableClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Close when clicking the dialog element itself (the backdrop area), not its children
    if (e.target === dialogRef.current) stableClose();
  };

  return (
    <dialog
      ref={dialogRef}
      className={`modal${overlayClassName ? ` ${overlayClassName}` : ''}${dialogClassName ? ` ${dialogClassName}` : ''}`}
      role="dialog"
      aria-label={ariaLabel}
      aria-modal="true"
      onClick={handleBackdropClick}
    >
      <div className="modal__content">
        {children}
      </div>
    </dialog>
  );
}
