import { Link } from 'react-router-dom'

export function FlowerMark({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
        <ellipse cx="24" cy="13.2" rx="4.7" ry="8.6" />
        <ellipse cx="24" cy="13.2" rx="4.7" ry="8.6" transform="rotate(72 24 24)" />
        <ellipse cx="24" cy="13.2" rx="4.7" ry="8.6" transform="rotate(144 24 24)" />
        <ellipse cx="24" cy="13.2" rx="4.7" ry="8.6" transform="rotate(216 24 24)" />
        <ellipse cx="24" cy="13.2" rx="4.7" ry="8.6" transform="rotate(288 24 24)" />
      </g>
      <circle cx="24" cy="24" r="2.6" fill="currentColor" />
    </svg>
  )
}

export function Brand({
  light = false,
  showWordmark = true,
  className = '',
}: {
  light?: boolean
  showWordmark?: boolean
  className?: string
}) {
  return (
    <Link
      to="/"
      className={`brand ${light ? 'brand--light' : ''} ${className}`.trim()}
      aria-label="FlowerBlog 首页"
    >
      <span className="brand__mark">
        <FlowerMark size={34} />
      </span>
      {showWordmark && (
        <span className="brand__wordmark">
          Flower<span>Blog</span>
        </span>
      )}
    </Link>
  )
}
