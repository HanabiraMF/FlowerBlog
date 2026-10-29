import { useEffect, type ReactNode } from 'react'
import { AlertTriangle, Loader2, X } from 'lucide-react'

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = '确认删除',
  cancelLabel = '取消',
  danger = true,
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <button className="modal__close" type="button" onClick={onCancel} aria-label="关闭">
          <X size={18} />
        </button>
        <span className={`modal__icon ${danger ? 'is-danger' : ''}`}>
          <AlertTriangle size={22} />
        </span>
        <h2 id="confirm-title">{title}</h2>
        <div className="modal__message">{message}</div>
        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${danger ? 'btn--danger' : 'btn--primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <Loader2 size={16} className="spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
