import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CornerDownRight,
  EyeOff,
  Loader2,
  MessageSquare,
  Trash2,
} from 'lucide-react'
import type { AdminCommentRow, CommentStatus, Paginated } from '../../../shared/types'
import { api, errorMessage } from '../../api'
import { Avatar } from '../../components/Avatar'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { EmptyState, InlineLoader } from '../../components/Loading'
import { useToast } from '../../context/ToastContext'
import { timeAgo } from '../../lib/format'

type Filter = 'all' | CommentStatus

const statusLabels: Record<CommentStatus, string> = {
  approved: '已通过',
  pending: '待审核',
  rejected: '已隐藏',
}

export function AdminComments() {
  const { toast } = useToast()
  const [items, setItems] = useState<AdminCommentRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminCommentRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const pageSize = 15

  const load = useCallback(
    async (targetPage = 1) => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('page', String(targetPage))
        params.set('pageSize', String(pageSize))
        if (filter !== 'all') params.set('status', filter)
        const data = await api.get<Paginated<AdminCommentRow>>(`/api/admin/comments?${params.toString()}`)
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
    [filter, toast],
  )

  useEffect(() => {
    void load(1)
  }, [load])

  async function setStatus(comment: AdminCommentRow, status: CommentStatus) {
    setBusyId(comment.id)
    try {
      await api.patch(`/api/admin/comments/${comment.id}`, { status })
      toast(status === 'approved' ? '评论已通过' : status === 'rejected' ? '评论已隐藏' : '评论已移回待审核')
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
      await api.delete(`/api/admin/comments/${deleteTarget.id}`)
      toast('评论已删除')
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
          {(['all', 'pending', 'approved', 'rejected'] as Filter[]).map((value) => (
            <button
              type="button"
              key={value}
              className={filter === value ? 'is-active' : ''}
              onClick={() => setFilter(value)}
            >
              {value === 'all' ? '全部' : statusLabels[value]}
            </button>
          ))}
        </div>
        <p className="admin-page__count">共 <strong>{total}</strong> 条</p>
      </div>

      {loading ? (
        <InlineLoader label="正在收听花园里的回声…" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<MessageSquare size={28} />}
          title={filter === 'pending' ? '没有待审核的评论' : '这里还没有评论'}
          description={filter === 'pending' ? '所有回应都已处理完毕，花园很安静。' : '等读者留下第一句回应吧。'}
        />
      ) : (
        <div className="admin-comment-list">
          {items.map((comment) => (
            <article className="admin-comment" key={comment.id}>
              <div className="admin-comment__main">
                <Avatar name={comment.user.username} src={comment.user.avatarUrl} size="md" />
                <div className="admin-comment__body">
                  <div className="admin-comment__head">
                    <strong>{comment.user.username}</strong>
                    {comment.parentId && (
                      <span className="admin-comment__reply">
                        <CornerDownRight size={12} /> 回复
                      </span>
                    )}
                    <span className={`admin-comment__status admin-comment__status--${comment.status}`}>
                      {statusLabels[comment.status]}
                    </span>
                    <span className="admin-comment__time">{timeAgo(comment.createdAt)}</span>
                  </div>
                  <p className="admin-comment__content">{comment.content}</p>
                  <Link to={`/post/${comment.postSlug}`} className="admin-comment__post">
                    在《{comment.postTitle}》下
                  </Link>
                </div>
              </div>

              <div className="admin-comment__actions">
                {busyId === comment.id ? (
                  <Loader2 size={18} className="spin" />
                ) : (
                  <>
                    {comment.status !== 'approved' && (
                      <button
                        type="button"
                        className="admin-action admin-action--approve"
                        onClick={() => void setStatus(comment, 'approved')}
                      >
                        <Check size={15} />
                        通过
                      </button>
                    )}
                    {comment.status !== 'rejected' && (
                      <button
                        type="button"
                        className="admin-action"
                        onClick={() => void setStatus(comment, 'rejected')}
                      >
                        <EyeOff size={15} />
                        隐藏
                      </button>
                    )}
                    {comment.status === 'rejected' && (
                      <button
                        type="button"
                        className="admin-action"
                        onClick={() => void setStatus(comment, 'pending')}
                      >
                        移回待审
                      </button>
                    )}
                    <button
                      type="button"
                      className="admin-action admin-action--danger"
                      onClick={() => setDeleteTarget(comment)}
                      aria-label="删除评论"
                    >
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
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
        title="删除这条评论？"
        message="评论及其回复将被永久删除，无法恢复。"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
