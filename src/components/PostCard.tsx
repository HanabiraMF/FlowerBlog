import { Link } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import type { PostSummary } from '../../shared/types'
import { formatShortDate, readingLabel } from '../lib/format'
import { Avatar } from './Avatar'
import { FlowerMark } from './Brand'

export function CoverFallback({ title }: { title: string }) {
  return (
    <div className="cover-fallback" aria-hidden="true">
      <div className="cover-fallback__orb" />
      <FlowerMark size={64} className="cover-fallback__flower" />
      <span className="cover-fallback__letter">{title.slice(0, 1)}</span>
    </div>
  )
}

export function PostCard({ post, index = 0 }: { post: PostSummary; index?: number }) {
  return (
    <article className="post-card" style={{ ['--i' as string]: index }}>
      <Link to={`/post/${post.slug}`} className="post-card__cover" aria-label={post.title}>
        {post.coverUrl ? (
          <img src={post.coverUrl} alt="" loading="lazy" />
        ) : (
          <CoverFallback title={post.title} />
        )}
        {post.tags[0] && <span className="post-card__tag">{post.tags[0]}</span>}
      </Link>
      <div className="post-card__body">
        <div className="post-card__meta">
          <span>{formatShortDate(post.publishedAt ?? post.createdAt)}</span>
          <span className="dot" />
          <span>{readingLabel(post.readingMinutes)}</span>
        </div>
        <Link to={`/post/${post.slug}`} className="post-card__title-link">
          <h3>{post.title}</h3>
        </Link>
        <p className="post-card__excerpt">{post.excerpt}</p>
        <div className="post-card__footer">
          <Link to={`/u/${encodeURIComponent(post.author.username)}`} className="byline">
            <Avatar name={post.author.username} src={post.author.avatarUrl} size="sm" />
            <span>{post.author.username}</span>
          </Link>
          <span className="post-card__comments" aria-label={`${post.commentCount} 条评论`}>
            <MessageCircle size={15} />
            {post.commentCount}
          </span>
        </div>
      </div>
    </article>
  )
}

export function PostCardSkeleton() {
  return (
    <div className="post-card post-card--skeleton" aria-hidden="true">
      <div className="skeleton skeleton--cover" />
      <div className="post-card__body">
        <div className="skeleton skeleton--line skeleton--short" />
        <div className="skeleton skeleton--line skeleton--title" />
        <div className="skeleton skeleton--line" />
        <div className="skeleton skeleton--line skeleton--medium" />
      </div>
    </div>
  )
}
