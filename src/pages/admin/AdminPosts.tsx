import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FilePenLine,
  Loader2,
  Search,
  Send,
  Star,
  Trash2,
  Undo2,
} from 'lucide-react'
import type { Paginated, PostStatus, PostSummary } from '../../../shared/types'
import { api, errorMessage } from '../../api'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { EmptyState, InlineLoader } from '../../components/Loading'
import { CoverFallback } from '../../components/PostCard'
import { useToast } from '../../context/ToastContext'
import { formatNumber, formatShortDate } from '../../lib/format'

type Filter = 'all' | PostStatus

export function AdminPosts() {
  const { toast } = useToast()
  const [items, setItems] = useState<PostSummary[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PostSummary | null>(null)
  const [deleting, setDeleting] = useState(false)
  const pageSize = 12

  const load = useCallback(
    async (targetPage = 1) => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('page', String(targetPage))
        params.set('pageSize', String(pageSize))
        if (query) params.set('q', query)
        if (filter !== 'all') params.set('status', filter)
        const data = await api.get<Paginated<PostSummary>>(`/api/admin/posts?${params.toString()}`)
        setItems(data.items)
        setTotal(data.total)
        setPage(data.page)
        setHasMore(data.hasMore)
      } catch (error) {
        toast(errorMessage(error), 'error')
      } finally {
        setLoading(false)
      }
    },
    [filter, query, toast],
  )

  useEffect(() => {
    void load(1)
  }, [load])

  function submitSearch(event: FormEvent) {
    event.preventDefault()
    setQuery(search.trim())
  }

  async function updatePost(
    post: PostSummary,
    changes: { status?: PostStatus; featured?: boolean },
  ) {
    setBusyId(post.id)
    try {
      await api.patch(`/api/admin/posts/${post.id}`, changes)
      toast(changes.featured ? '已设为首页精选' : changes.status === 'published' ? '文章已发布' : '文章已转为草稿')
      await load(page)
    } catch (error) {
      toast(errorMessage(error), 'error')
    } finally {
      setBusyId(null)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/api/admin/posts/${deleteTarget.id}`)
      toast('文章已删除')
      setDeleteTarget(null)
      await load(items.length === 1 && page > 1 ? page - 1 : page)
    } catch (error) {
      toast(errorMessage(error), 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page__toolbar">
        <div className="admin-filter-tabs">
          {(['all', 'published', 'draft'] as Filter[]).map((value) => (
            <button
              type="button"
              key={value}
              className={filter === value ? 'is-active' : ''}
              onClick={() => setFilter(value)}
            >
              {value === 'all' ? '全部' : value === 'published' ? '已发布' : '草稿'}
            </button>
          ))}
        </div>
        <form className="admin-search" onSubmit={submitSearch}>
          <Search size={16} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="搜索标题或作者"
            aria-label="搜索文章"
          />
          <button type="submit" className="btn btn--ghost btn--xs">搜索</button>
        </form>
        <Link to="/write" className="btn btn--primary btn--sm admin-page__new">
          <FilePenLine size={15} />
          写新文章
        </Link>
      </div>

      <div className="admin-list-head">
        <p>共 <strong>{total}</strong> 篇文章</p>
        <p>第 {page} 页</p>
      </div>

      {loading ? (
        <InlineLoader label="正在翻找文章…" />
      ) : items.length === 0 ? (
        <EmptyState
          title="没有找到文章"
          description="换一个筛选条件，或者去写一篇新的。"
          actionLabel="写新文章"
          actionTo="/write"
        />
      ) : (
        <div className="admin-table-wrap admin-table-wrap--card">
          <table className="admin-table admin-table--posts">
            <thead>
              <tr>
                <th>文章</th>
                <th>作者</th>
                <th>状态</th>
                <th>数据</th>
                <th>更新于</th>
                <th aria-label="操作" />
              </tr>
            </thead>
            <tbody>
              {items.map((post) => (
                <tr key={post.id}>
                  <td>
                    <div className="admin-post-cell">
                      <Link to={post.status === 'published' ? `/post/${post.slug}` : `/write/${post.id}`} className="admin-post-cell__cover">
                        {post.coverUrl ? <img src={post.coverUrl} alt="" loading="lazy" /> : <CoverFallback title={post.title} />}
                      </Link>
                      <div>
                        <Link to={`/write/${post.id}`} className="admin-table__title">{post.title}</Link>
                        <span className="admin-table__sub">
                          {post.featured && <><Star size={12} fill="currentColor" /> 精选</>}
                          {post.tags.slice(0, 2).map((tag) => `#${tag}`).join(' · ')}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Link to={`/u/${encodeURIComponent(post.author.username)}`} className="admin-table__author">
                      {post.author.username}
                    </Link>
                  </td>
                  <td>
                    <span className={`status-pill status-pill--${post.status}`}>
                      <span />
                      {post.status === 'published' ? '已发布' : '草稿'}
                    </span>
                  </td>
                  <td>
                    <span className="admin-table__data">
                      <Eye size={13} /> {formatNumber(post.views)}
                      <span className="dot" />
                      {post.commentCount} 评
                    </span>
                  </td>
                  <td>{formatShortDate(post.updatedAt)}</td>
                  <td>
                    <div className="admin-row-actions">
                      {busyId === post.id ? (
                        <Loader2 size={17} className="spin" />
                      ) : (
                        <>
                          <button
                            type="button"
                            title={post.featured ? '取消精选' : '设为精选'}
                            className={post.featured ? 'is-active' : ''}
                            onClick={() => void updatePost(post, { featured: !post.featured })}
                          >
                            <Star size={16} fill={post.featured ? 'currentColor' : 'none'} />
                          </button>
                          {post.status === 'published' ? (
                            <button
                              type="button"
                              title="转为草稿"
                              onClick={() => void updatePost(post, { status: 'draft' })}
                            >
                              <Undo2 size={16} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              title="发布文章"
                              onClick={() => void updatePost(post, { status: 'published' })}
                            >
                              <Send size={16} />
                            </button>
                          )}
                          <Link to={`/write/${post.id}`} title="编辑文章">
                            <FilePenLine size={16} />
                          </Link>
                          <button
                            type="button"
                            title="删除文章"
                            className="is-danger"
                            onClick={() => setDeleteTarget(post)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > pageSize && (
        <div className="admin-pagination">
          <button type="button" className="btn btn--ghost btn--sm" disabled={page <= 1} onClick={() => void load(page - 1)}>
            <ChevronLeft size={16} />
            上一页
          </button>
          <span>{page} / {Math.max(1, Math.ceil(total / pageSize))}</span>
          <button type="button" className="btn btn--ghost btn--sm" disabled={!hasMore} onClick={() => void load(page + 1)}>
            下一页
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="删除这篇文章？"
        message={<>《{deleteTarget?.title}》及其所有评论将被永久删除，这个操作无法撤销。</>}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
