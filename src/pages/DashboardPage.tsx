import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  Eye,
  FilePenLine,
  FilePlus2,
  Files,
  MessageCircle,
  PenLine,
  Plus,
  Shield,
  Sparkles,
  Trash2,
} from 'lucide-react'
import type { PostSummary } from '../../shared/types'
import { api, errorMessage } from '../api'
import { Avatar } from '../components/Avatar'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EmptyState, FullPageLoader } from '../components/Loading'
import { CoverFallback } from '../components/PostCard'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { formatNumber, formatShortDate } from '../lib/format'
import { usePageTitle } from '../lib/usePageTitle'

type Tab = 'all' | 'published' | 'draft'

export function DashboardPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  usePageTitle('创作台')
  const [posts, setPosts] = useState<PostSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('all')
  const [deleteTarget, setDeleteTarget] = useState<PostSummary | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function load() {
    try {
      const data = await api.get<{ items: PostSummary[] }>('/api/me/posts')
      setPosts(data.items)
    } catch (error) {
      toast(errorMessage(error), 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/api/posts/${deleteTarget.id}`)
      setPosts((current) => current.filter((post) => post.id !== deleteTarget.id))
      toast('文章已删除')
      setDeleteTarget(null)
    } catch (error) {
      toast(errorMessage(error), 'error')
    } finally {
      setDeleting(false)
    }
  }

  if (!user || loading) return <FullPageLoader label="正在整理你的稿纸…" />

  const published = posts.filter((post) => post.status === 'published')
  const drafts = posts.filter((post) => post.status === 'draft')
  const totalViews = posts.reduce((sum, post) => sum + post.views, 0)
  const totalComments = posts.reduce((sum, post) => sum + post.commentCount, 0)
  const visible = tab === 'all' ? posts : posts.filter((post) => post.status === tab)
  const hour = new Date().getHours()
  const greeting = hour < 6 ? '夜深了' : hour < 11 ? '早上好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : '晚上好'

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        <div className="container dashboard-hero__inner">
          <div>
            <span className="eyebrow">
              <span className="eyebrow__line" />
              YOUR WRITING DESK
            </span>
            <h1>
              {greeting}，{user.username}
              <em>。</em>
            </h1>
            <p>这里是你种下的所有文字。它们有的已经开花，有的还在土里慢慢酝酿。</p>
          </div>
          <div className="dashboard-hero__actions">
            <Link to="/write" className="btn btn--primary">
              <Plus size={17} />
              写一篇新文章
            </Link>
            {user.role === 'admin' && (
              <Link to="/admin" className="btn btn--ghost">
                <Shield size={17} />
                管理后台
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="container dashboard-content">
        <div className="dashboard-stats">
          <div className="stat-card">
            <span className="stat-card__icon"><Files size={19} /></span>
            <div>
              <strong>{posts.length}</strong>
              <span>全部文章</span>
            </div>
            <small>所有写下过的文字</small>
          </div>
          <div className="stat-card">
            <span className="stat-card__icon stat-card__icon--sage"><Sparkles size={19} /></span>
            <div>
              <strong>{published.length}</strong>
              <span>已经开花</span>
            </div>
            <small>公开在花园里的文章</small>
          </div>
          <div className="stat-card">
            <span className="stat-card__icon stat-card__icon--clay"><Eye size={19} /></span>
            <div>
              <strong>{formatNumber(totalViews)}</strong>
              <span>累计阅读</span>
            </div>
            <small>有人认真读过的次数</small>
          </div>
          <div className="stat-card">
            <span className="stat-card__icon stat-card__icon--gold"><MessageCircle size={19} /></span>
            <div>
              <strong>{formatNumber(totalComments)}</strong>
              <span>收到回应</span>
            </div>
            <small>文字与文字之间的回声</small>
          </div>
        </div>

        <div className="dashboard-workspace">
          <div className="dashboard-toolbar">
            <div className="segmented">
              <button type="button" className={tab === 'all' ? 'is-active' : ''} onClick={() => setTab('all')}>
                全部 <span>{posts.length}</span>
              </button>
              <button type="button" className={tab === 'published' ? 'is-active' : ''} onClick={() => setTab('published')}>
                已发布 <span>{published.length}</span>
              </button>
              <button type="button" className={tab === 'draft' ? 'is-active' : ''} onClick={() => setTab('draft')}>
                草稿 <span>{drafts.length}</span>
              </button>
            </div>
            <Link to="/write" className="text-link">
              <FilePlus2 size={15} />
              新建文章
            </Link>
          </div>

          {visible.length === 0 ? (
            <EmptyState
              icon={<PenLine size={30} />}
              title={tab === 'draft' ? '还没有未完成的草稿' : '这里还没有文章'}
              description={
                tab === 'draft'
                  ? '有想法的时候，先存成草稿，等它慢慢长大。'
                  : '写下第一篇文字吧，不必完美，真诚就足够。'
              }
              actionLabel="开始写作"
              actionTo="/write"
            />
          ) : (
            <div className="my-posts">
              {visible.map((post) => (
                <article className="my-post" key={post.id}>
                  <Link to={post.status === 'published' ? `/post/${post.slug}` : `/write/${post.id}`} className="my-post__cover">
                    {post.coverUrl ? <img src={post.coverUrl} alt="" loading="lazy" /> : <CoverFallback title={post.title} />}
                  </Link>
                  <div className="my-post__main">
                    <div className="my-post__meta">
                      <span className={`status-pill status-pill--${post.status}`}>
                        <span />
                        {post.status === 'published' ? '已发布' : '草稿'}
                      </span>
                      <span>{post.status === 'published' ? formatShortDate(post.publishedAt) : `更新于 ${formatShortDate(post.updatedAt)}`}</span>
                      {post.tags[0] && <span>#{post.tags[0]}</span>}
                    </div>
                    <Link
                      to={post.status === 'published' ? `/post/${post.slug}` : `/write/${post.id}`}
                      className="my-post__title"
                    >
                      {post.title}
                    </Link>
                    <p className="my-post__excerpt">{post.excerpt}</p>
                    <div className="my-post__stats">
                      <span><Eye size={14} /> {formatNumber(post.views)}</span>
                      <span><MessageCircle size={14} /> {post.commentCount}</span>
                      <span>{post.readingMinutes} 分钟阅读</span>
                    </div>
                  </div>
                  <div className="my-post__actions">
                    {post.status === 'published' && (
                      <Link to={`/post/${post.slug}`} className="my-post__action" aria-label="查看文章">
                        <ArrowUpRight size={17} />
                      </Link>
                    )}
                    <Link to={`/write/${post.id}`} className="my-post__action" aria-label="编辑文章">
                      <FilePenLine size={17} />
                    </Link>
                    <button
                      type="button"
                      className="my-post__action my-post__action--danger"
                      onClick={() => setDeleteTarget(post)}
                      aria-label="删除文章"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="dashboard-footnote">
          <Avatar name={user.username} src={user.avatarUrl} size="md" />
          <p>
            <strong>写作是一件私人的小事。</strong>
            不必和别人比较进度，你只需要对自己的文字诚实。
          </p>
          <Link to="/settings" className="text-link">完善个人资料</Link>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="确定删除这篇文章？"
        message={
          <>
            文章 <strong>《{deleteTarget?.title}》</strong> 及其评论将被永久删除，不能恢复。
          </>
        }
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
