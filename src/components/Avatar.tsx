import { initials } from '../lib/format'

type Size = 'sm' | 'md' | 'lg' | 'xl'

export function Avatar({
  name,
  src,
  size = 'md',
  className = '',
}: {
  name: string
  src?: string | null
  size?: Size
  className?: string
}) {
  const tones = ['sage', 'clay', 'gold', 'plum', 'forest']
  const code = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const tone = tones[code % tones.length]

  return (
    <span className={`avatar avatar--${size} avatar--${tone} ${className}`.trim()} aria-hidden={!!src}>
      {src ? <img src={src} alt={name} loading="lazy" /> : <span>{initials(name)}</span>}
    </span>
  )
}
