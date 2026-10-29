import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowUp,
  CalendarDays,
  Eye,
  Link2,
  MessageCircle,
  PencilLine,
  Timer,
} from 'lucide-react'
import type { PostDetail } from '../../shared/types'
import { api, errorMessage } from '../api'
import { Avatar } from '../components/Avatar'
import { FlowerMark } from '../components/Brand'
import { CommentSection } from '../components/CommentSection'
import { EmptyState } from '../components/Loading'
import { Markdown } from '../components/Markdown'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { formatDate, formatNumber, readingLabel } from '../lib/format'
import { usePageTitle } from '../lib/usePageTitle'

export function PostPage() {
  const { slug = '' } = useParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const [post, setPost] = useState<PostDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [progress, setProgress] = useState(0)
  usePageTitle(post?.title)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setNotFound(false)
    api
      .get<PostDetail>(`/api/posts/${encodeURIComponent(slug)}`)
      .then((data) => {
        if (alive) setPost(data)
      })
      .catch((error) => {
        if (!alive) return
        setNotFound(true)
        if (!(error instanceof Error) || !error.message.includes('不存在')) {
          toast(errorMessage(error), 'error')
        }
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [slug, toast])

  useEffect(() => {
    function onScroll() {
      const max = document.documentElement.scrollHeight - window.innerHeight
      setProgress(max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [post])

  const handleCommentCount = useCallback((count: number) => {
    setPost((current) => (current ? { ...current, commentCount: count } : current))
  }, [])

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast('文章链接已复制')
    } catch {
      toast('复制失败，请手动复制地址栏链接', 'error')
    }
  }

  if (loading) {
    return (
      <div className="container post-skeleton">
        <div className="skeleton skeleton--line skeleton--short" />
        <div className="skeleton skeleton--line skeleton--hero" />
        <div className="skeleton skeleton--line skeleton--medium" />
        <div className="skeleton skeleton--cover" />
        <div className="skeleton skeleton--line" />
        <div className="skeleton skeleton--line" />
        <div className="skeleton skeleton--line skeleton--medium" />
      </div>
    )
  }

  if (notFound || !post) {
    return (
      <div className="container page-pad">
        <EmptyState
          icon={<FlowerMark size={40} />}
          title="这朵花还没开，或者已经谢了"
          description="这篇文章可能已被删除，或还没有对外发布。去花园里看看别的文字吧。"
          actionLabel="回到发现"
          actionTo="/explore"
        />
      </div>
    )
  }

  const canEdit = user && (user.id === post.author.id || user.role === 'admin')

  return (
    <article className="post-page">
      <div className="reading-progress" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <header className="container post-head">
        <Link to="/explore" className="back-link">
          <ArrowLeft size={16} />
          回到花园
        </Link>

        {post.status === 'draft' && (
          <div className="draft-banner">
            <PencilLine size={16} />
            这是一篇草稿，目前只有你自己和管理员可以看到。
            <Link to={`/write/${post.id}`}>继续编辑</Link>
          </div>
        )}

        <div className="post-head__tags">
          {post.tags.map((tag) => (
            <Link key={tag} to={`/explore?tag=${encodeURIComponent(tag)}`}>
              #{tag}
            </Link>
          ))}
        </div>
        <h1>{post.title}</h1>
        {post.excerpt && <p className="post-head__excerpt">{post.excerpt}</p>}

        <div className="post-head__meta">
          <Link to={`/u/${encodeURIComponent(post.author.username)}`} className="byline">
            <Avatar name={post.author.username} src={post.author.avatarUrl} size="md" />
            <span>
              <strong>{post.author.username}</strong>
              <small>{post.author.role === 'admin' ? '花园管理员' : '写作者'}</small>
            </span>
          </Link>
          <span className="meta-divider" />
          <span className="post-meta-item">
            <CalendarDays size={15} />
            {formatDate(post.publishedAt ?? post.createdAt)}
          </span>
          <span className="post-meta-item">
            <Timer size={15} />
            {readingLabel(post.readingMinutes)}
          </span>
          <span className="post-meta-item">
            <Eye size={15} />
            {formatNumber(post.views)} 阅读
          </span>
          <span className="post-meta-item">
            <MessageCircle size={15} />
            {post.commentCount} 回应
          </span>
          {canEdit && (
            <Link to={`/write/${post.id}`} className="btn btn--ghost btn--xs post-head__edit">
              <PencilLine size={14} />
              编辑
            </Link>
          )}
        </div>
      </header>

      {post.coverUrl && (
        <figure className="container post-cover">
          <img src={post.coverUrl} alt={post.title} />
          <figcaption>
            <FlowerMark size={16} />
            {post.excerpt.slice(0, 44) || post.title}
          </figcaption>
        </figure>
      )}

      <div className="container post-layout">
        <aside className="post-share" aria-label="分享这篇文章">
          <span className="post-share__label">SHARE</span>
          <button type="button" className="post-share__button" onClick={copyLink} aria-label="复制链接">
            <Link2 size={18} />
          </button>
          <button
            type="button"
            className="post-share__button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="回到顶部"
          >
            <ArrowUp size={18} />
          </button>
          <span className="post-share__line" />
          <span className="post-share__flower">
            <FlowerMark size={22} />
          </span>
        </aside>

        <div className="post-content">
          <Markdown content={post.content} />

          <div className="post-end">
            <FlowerMark size={30} />
            <span>文字到这里，就交给你了。</span>
          </div>

          {post.tags.length > 0 && (
            <div className="post-tags">
              <span>收藏在</span>
              {post.tags.map((tag) => (
                <Link key={tag} to={`/explore?tag=${encodeURIComponent(tag)}`}>
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          <div className="author-card">
            <div className="author-card__top">
              <Avatar name={post.author.username} src={post.author.avatarUrl} size="lg" />
              <div className="author-card__intro">
                <span className="eyebrow">ABOUT THE WRITER</span>
                <Link to={`/u/${encodeURIComponent(post.author.username)}`}>
                  {post.author.username}
                </Link>
                <p>{post.author.bio || '在这个花园里，安静地记录一些什么。'}</p>
              </div>
              <Link
                to={`/u/${encodeURIComponent(post.author.username)}`}
                className="btn btn--ghost btn--sm author-card__button"
              >
                查看主页
              </Link>
            </div>
            <div className="author-card__bottom">
              <span>
                <CalendarDays size={14} /> 写于 {formatDate(post.publishedAt ?? post.createdAt)}
              </span>
              <button type="button" className="text-link" onClick={copyLink}>
                <Link2 size={14} />
                分享这篇文章
              </button>
            </div>
          </div>

          <CommentSection postSlug={post.slug} onCountChange={handleCommentCount} />
        </div>
      </div>
    </article>
  )
}
