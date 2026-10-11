import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  title: string;
  description?: string;
  busy?: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Dialog({
  open,
  title,
  description,
  busy,
  onClose,
  children,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId(),
    descriptionId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog?.open) dialog?.showModal();
    if (!open && dialog?.open) dialog.close();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, [open]);

  return createPortal(
    <dialog
      ref={ref}
      className="learning-dialog"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div className="learning-dialog-body">
        <div className="learning-dialog-heading">
          <h2 id={titleId}>{title}</h2>
          <button
            type="button"
            className="workspace-icon-button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>
        {description && (
          <p id={descriptionId} className="learning-dialog-description">
            {description}
          </p>
        )}
        {children}
      </div>
    </dialog>,
    document.body,
  );
}
