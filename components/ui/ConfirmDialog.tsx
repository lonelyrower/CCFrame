'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = '确认',
  cancelText = '取消',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = 'confirm-dialog-title';
  const descriptionId = 'confirm-dialog-description';

  return (
    <Modal open={open} onClose={onCancel} labelledBy={titleId} describedBy={descriptionId}>
      <h2 id={titleId} className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-50 mb-3">
        {title}
      </h2>
      <p id={descriptionId} className="text-sm text-[color:var(--ds-muted)] leading-relaxed">
        {description}
      </p>

      <div className="mt-8 flex gap-3">
        <Button onClick={onConfirm} variant="primary" className="flex-1" isLoading={isLoading}>
          {confirmText}
        </Button>
        <Button onClick={onCancel} variant="secondary" className="flex-1" disabled={isLoading}>
          {cancelText}
        </Button>
      </div>
    </Modal>
  );
}
