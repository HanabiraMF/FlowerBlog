export function formatDate(value: string | null | undefined): string {
  if (!value) return '尚未发布'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function formatShortDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export function timeAgo(value: string): string {
  const date = new Date(value)
  const diff = Date.now() - date.getTime()
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour
  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`
  if (diff < day) return `${Math.floor(diff / hour)} 小时前`
  if (diff < 7 * day) return `${Math.floor(diff / day)} 天前`
  return formatShortDate(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('zh-CN').format(value)
}

export function roleLabel(role: string): string {
  if (role === 'admin') return '管理员'
  if (role === 'demo') return '示例作者'
  return '作者'
}

export function initials(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return '花'
  return [...trimmed].slice(0, 1).join('').toUpperCase()
}

export function readingLabel(minutes: number): string {
  return `${Math.max(1, minutes)} 分钟阅读`
}

export function weekdayLabel(date: string): string {
  return new Intl.DateTimeFormat('zh-CN', { weekday: 'short' }).format(new Date(`${date}T00:00:00`))
}
