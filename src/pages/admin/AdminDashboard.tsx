import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  Clock,
  Eye,
  FileText,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import type { AdminStats } from '../../../shared/types'
import { api, errorMessage } from '../../api'
import { Avatar } from '../../components/Avatar'
import { FlowerMark } from '../../components/Brand'
import { FullPageLoader } from '../../components/Loading'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { formatNumber, formatShortDate, timeAgo, weekdayLabel } from '../../lib/format'

export function AdminDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    api
      .get<AdminStats>('/api/admin/stats')
      .then((data) => {
        if (alive) setStats(data)
      })
      .catch((error) => toast(errorMessage(error), 'error'))
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [toast])

  if (loading || !stats) return <FullPageLoader label="正在整理花园的账本…" />

  const maxViews = Math.max(1, ...stats.weeklyViews.map((item) => item.views))
  const weekTotal = stats.weeklyViews.reduce((sum, item) => sum + item.views, 0)

  return (
    <div className="admin-dashboard">
      <section className="admin-welcome">
        <div>
          <span className="eyebrow">
            <span className="eyebrow__line" />
            WELCOME BACK, GARDENER
          </span>
          <h2>欢迎回来，{user?.username}。</h2>
          <p>今天也来看看，花园里长出了什么新的东西。</p>
        </div>
        <div className="admin-welcome__flower">
          <FlowerMark size={90} />
        </div>
      </section>

      <div className="admin-stat-grid">
        <div className="admin-stat">
          <span className="admin-stat__icon"><FileText size={19} /></span>
          <div className="admin-stat__value">{formatNumber(stats.totals.posts)}</div>
          <span className="admin-stat__label">全部文章</span>
          <span className="admin-stat__foot">{stats.totals.published} 已发布 · {stats.totals.drafts} 草稿</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat__icon admin-stat__icon--sage"><Users size={19} /></span>
          <div className="admin-stat__value">{formatNumber(stats.totals.users)}</div>
          <span className="admin-stat__label">园中读者</span>
          <span className="admin-stat__foot">注册账号总数</span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat__icon admin-stat__icon--clay"><MessageSquare size={19} /></span>
          <div className="admin-stat__value">{formatNumber(stats.totals.comments)}</div>
          <span className="admin-stat__label">全部评论</span>
          <span className={`admin-stat__foot ${stats.totals.pendingComments ? 'is-warn' : ''}`}>
            {stats.totals.pendingComments ? `${stats.totals.pendingComments} 条待审核` : '全部已处理'}
          </span>
        </div>
        <div className="admin-stat">
          <span className="admin-stat__icon admin-stat__icon--gold"><Eye size={19} /></span>
          <div className="admin-stat__value">{formatNumber(stats.totals.views)}</div>
          <span className="admin-stat__label">累计阅读</span>
          <span className="admin-stat__foot">所有文章阅读总数</span>
        </div>
      </div>

      <div className="admin-grid">
        <section className="admin-card admin-card--chart">
          <div className="admin-card__head">
            <div>
              <span className="eyebrow">LAST 7 DAYS</span>
              <h3>花园里的脚步</h3>
            </div>
            <span className="admin-chart__total">
              <TrendingUp size={16} />
              {formatNumber(weekTotal)} 次阅读
            </span>
          </div>
          <div className="admin-chart">
            {stats.weeklyViews.map((day) => (
              <div className="admin-chart__col" key={day.date}>
                <span className="admin-chart__value">{day.views || ''}</span>
                <div className="admin-chart__track">
                  <div
                    className="admin-chart__bar"
                    style={{ height: `${Math.max(4, (day.views / maxViews) * 100)}%` }}
                  />
                </div>
                <span className="admin-chart__label">{weekdayLabel(day.date)}</span>
                <span className="admin-chart__date">{day.date.slice(5).replace('-', '/')}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-card admin-card--pending">
          <div className="admin-card__head">
            <div>
              <span className="eyebrow">NEEDS ATTENTION</span>
              <h3>等你看看的回应</h3>
            </div>
            <Link to="/admin/comments" className="text-link">全部评论 <ArrowUpRight size={14} /></Link>
          </div>
          {stats.recentComments.length === 0 ? (
            <p className="admin-empty-text">还没有评论，花园很安静。</p>
          ) : (
            <div className="admin-mini-comments">
              {stats.recentComments.slice(0, 3).map((comment) => (
                <div key={comment.id} className="admin-mini-comment">
                  <Avatar name={comment.user.username} src={comment.user.avatarUrl} size="sm" />
                  <div>
                    <div className="admin-mini-comment__head">
                      <strong>{comment.user.username}</strong>
                      {comment.status === 'pending' && <span className="mini-badge">待审核</span>}
                      <span>{timeAgo(comment.createdAt)}</span>
                    </div>
                    <p>{comment.content}</p>
                    <Link to={`/post/${comment.postSlug}`}>《{comment.postTitle}》</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="admin-card admin-card--recent">
          <div className="admin-card__head">
            <div>
              <span className="eyebrow">RECENT STORIES</span>
              <h3>最近的文章</h3>
            </div>
            <Link to="/admin/posts" className="text-link">管理文章 <ArrowUpRight size={14} /></Link>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>文章</th>
                  <th>作者</th>
                  <th>状态</th>
                  <th>阅读</th>
                  <th>更新</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentPosts.map((post) => (
                  <tr key={post.id}>
                    <td>
                      <Link to={`/post/${post.slug}`} className="admin-table__title">
                        {post.title}
                      </Link>
                    </td>
                    <td>{post.author.username}</td>
                    <td>
                      <span className={`status-pill status-pill--${post.status}`}>
                        <span />
                        {post.status === 'published' ? '已发布' : '草稿'}
                      </span>
                    </td>
                    <td>{formatNumber(post.views)}</td>
                    <td>{formatShortDate(post.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-card admin-card--top">
          <div className="admin-card__head">
            <div>
              <span className="eyebrow">POPULAR</span>
              <h3>最受欢迎的文章</h3>
            </div>
            <Sparkles size={18} />
          </div>
          <div className="admin-top-posts">
            {stats.topPosts.map((post, index) => (
              <Link to={`/post/${post.slug}`} key={post.id}>
                <span className="admin-top-posts__index">{String(index + 1).padStart(2, '0')}</span>
                <span className="admin-top-posts__title">{post.title}</span>
                <span className="admin-top-posts__views">{formatNumber(post.views)}</span>
              </Link>
            ))}
            {stats.topPosts.length === 0 && <p className="admin-empty-text">还没有阅读数据。</p>}
          </div>
          <div className="admin-quick">
            <Link to="/admin/settings">
              <ShieldCheck size={16} />
              站点设置
            </Link>
            <Link to="/admin/comments">
              <MessageSquare size={16} />
              审核评论
            </Link>
            <Link to="/admin/users">
              <Users size={16} />
              管理用户
            </Link>
          </div>
        </section>
      </div>

      <div className="admin-tip">
        <Clock size={17} />
        <p>小提示：被设为「精选」的文章会出现在首页最上方。一次只保留一篇精选，会让首页更清爽。</p>
      </div>
    </div>
  )
}
