import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CalendarDays, Eye, FileText, PencilLine } from 'lucide-react'
import type { AuthorPageData } from '../../shared/types'
import { api, errorMessage } from '../api'
import { Avatar } from '../components/Avatar'
import { FlowerMark } from '../components/Brand'
import { EmptyState, FullPageLoader } from '../components/Loading'
import { PostCard } from '../components/PostCard'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { formatDate, formatNumber, roleLabel } from '../lib/format'
import { usePageTitle } from '../lib/usePageTitle'

export function AuthorPage() {
  const { username = '' } = useParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const [data, setData] = useState<AuthorPageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  usePageTitle(data?.user.username ?? '作者')

  useEffect(() => {
    let alive = true
    setLoading(true)
    setNotFound(false)
    api
      .get<AuthorPageData>(`/api/users/${encodeURIComponent(username)}`)
      .then((result) => {
        if (alive) setData(result)
      })
      .catch((error) => {
        if (!alive) return
        setNotFound(true)
        toast(errorMessage(error), 'error')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [username, toast])

  if (loading) return <FullPageLoader label="正在拜访作者的花园…" />

  if (notFound || !data) {
    return (
      <div className="container page-pad">
        <EmptyState
          icon={<FlowerMark size={40} />}
          title="没有找到这位作者"
          description="也许 ta 换了一个花园，或者还没有在这里种下文字。"
          actionLabel="回到发现"
          actionTo="/explore"
        />
      </div>
    )
  }

  const isSelf = user?.id === data.user.id

  return (
    <div className="author-page">
      <section className="author-hero">
        <FlowerMark size={360} className="author-hero__flower" />
        <div className="container author-hero__inner">
          <div className="author-hero__avatar">
            <Avatar name={data.user.username} src={data.user.avatarUrl} size="xl" />
            <span className="author-hero__petal" aria-hidden="true" />
          </div>
          <div className="author-hero__copy">
            <span className="eyebrow">
              <span className="eyebrow__line" />
              THE GARDENER
            </span>
            <h1>{data.user.username}</h1>
            <div className="author-hero__badges">
              <span className="badge">{roleLabel(data.user.role)}</span>
              <span className="badge badge--soft">
                <CalendarDays size={13} /> {formatDate(data.user.createdAt)} 加入
              </span>
            </div>
            <p>{data.user.bio || '一位在 FlowerBlog 安静写字的作者，还没有写下自我介绍。'}</p>
            <div className="author-hero__actions">
              {isSelf ? (
                <>
                  <Link to="/settings" className="btn btn--ghost btn--sm">
                    <PencilLine size={15} />
                    编辑资料
                  </Link>
                  <Link to="/write" className="btn btn--primary btn--sm">
                    写一篇新文章
                  </Link>
                </>
              ) : (
                <Link to="/explore" className="btn btn--ghost btn--sm">
                  在花园中继续漫游
                </Link>
              )}
            </div>
          </div>
          <div className="author-hero__stats">
            <div>
              <strong>{formatNumber(data.stats.posts)}</strong>
              <span>
                <FileText size={13} /> 公开文章
              </span>
            </div>
            <div>
              <strong>{formatNumber(data.stats.views)}</strong>
              <span>
                <Eye size={13} /> 累计阅读
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="container author-posts">
        <div className="section-head">
          <div>
            <span className="eyebrow">
              <span className="eyebrow__line" />
              FROM THIS GARDEN
            </span>
            <h2>TA 种下的文字</h2>
          </div>
          <span className="muted">共 {data.posts.length} 篇</span>
        </div>

        {data.posts.length > 0 ? (
          <div className="post-grid">
            {data.posts.map((post, index) => (
              <PostCard key={post.id} post={post} index={index} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<FlowerMark size={36} />}
            title="这片小花园还空着"
            description={isSelf ? '写下第一篇文章，让这里开始生长。' : '作者还没有发布公开的文章，过些时候再来看看吧。'}
            actionLabel={isSelf ? '开始写作' : undefined}
            actionTo={isSelf ? '/write' : undefined}
          />
        )}
      </section>
    </div>
  )
}
