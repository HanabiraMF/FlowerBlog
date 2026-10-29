import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Loader2, Sprout } from 'lucide-react'

export function FullPageLoader({ label = '正在整理花园…' }: { label?: string }) {
  return (
    <div className="full-loader">
      <span className="full-loader__flower">
        <Loader2 size={30} className="spin" />
      </span>
      <p>{label}</p>
    </div>
  )
}

export function InlineLoader({ label = '加载中…' }: { label?: string }) {
  return (
    <div className="inline-loader">
      <Loader2 size={20} className="spin" />
      <span>{label}</span>
    </div>
  )
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
  icon,
}: {
  title: string
  description: ReactNode
  actionLabel?: string
  actionTo?: string
  onAction?: () => void
  icon?: ReactNode
}) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">{icon ?? <Sprout size={30} />}</span>
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn btn--primary btn--sm">
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && (
        <button type="button" className="btn btn--primary btn--sm" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  )
}
