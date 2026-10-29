import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CornerDownRight, Loader2, Lock, MessageCircle, Send, Trash2 } from 'lucide-react'
import type { Comment } from '../../shared/types'
import { api, errorMessage } from '../api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { timeAgo } from '../lib/format'
import { Avatar } from './Avatar'
import { ConfirmDialog } from './ConfirmDialog'
import { EmptyState, InlineLoader } from './Loading'

export function CommentSection({
  postSlug,
  onCountChange,
}: {
  postSlug: string
  onCountChange?: (count: number) => void
}) {
  const { user } = useAuth()
  const { toast } = useToast()
  const location = useLocation()
  const [comments, setComments] = useState<Comment[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [replySubmitting, setReplySubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Comment | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    try {
      const data = await api.get<{ items: Comment[]; total: number }>(
        `/api/posts/${encodeURIComponent(postSlug)}/comments`,
      )
      setComments(data.items)
      setTotal(data.total)
      onCountChange?.(data.total)
    } catch (error) {
      toast(errorMessage(error), 'error')
    } finally {
      setLoading(false)
    }
  }, [postSlug, toast, onCountChange])

  useEffect(() => {
    setLoading(true)
    void load()
  }, [load])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    try {
      const data = await api.post<{ pending: boolean }>(
        `/api/posts/${encodeURIComponent(postSlug)}/comments`,
        { content: content.trim() },
      )
      setContent('')
      if (data.pending) {
        toast('评论已提交，审核通过后会出现在这里')
      } else {
        toast('评论已种下')
        await load()
      }
    } catch (error) {
      toast(errorMessage(error), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitReply(event: FormEvent, parentId: string) {
    event.preventDefault()
    if (!replyContent.trim()) return
    setReplySubmitting(true)
    try {
      const data = await api.post<{ pending: boolean }>(
        `/api/posts/${encodeURIComponent(postSlug)}/comments`,
        { content: replyContent.trim(), parentId },
      )
      setReplyContent('')
      setReplyTo(null)
      if (data.pending) {
        toast('回复已提交，审核通过后会出现在这里')
      } else {
        toast('回复已送达')
        await load()
      }
    } catch (error) {
      toast(errorMessage(error), 'error')
    } finally {
      setReplySubmitting(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/api/comments/${deleteTarget.id}`)
      toast('评论已删除')
      setDeleteTarget(null)
      await load()
    } catch (error) {
      toast(errorMessage(error), 'error')
    } finally {
      setDeleting(false)
    }
  }

  const countLabel = useMemo(() => (total ? `${total} 条回应` : '还没有回应'), [total])

  function renderComment(comment: Comment, isReply = false) {
    const canDelete = user && (user.id === comment.user.id || user.role === 'admin')
    return (
      <div className={`comment ${isReply ? 'comment--reply' : ''}`} key={comment.id}>
        <Link to={`/u/${encodeURIComponent(comment.user.username)}`}>
          <Avatar name={comment.user.username} src={comment.user.avatarUrl} size="md" />
        </Link>
        <div className="comment__body">
          <div className="comment__head">
            <Link to={`/u/${encodeURIComponent(comment.user.username)}`} className="comment__name">
              {comment.user.username}
            </Link>
            {comment.user.role === 'admin' && <span className="comment__badge">管理员</span>}
            <span className="comment__time">{timeAgo(comment.createdAt)}</span>
          </div>
          <p className="comment__text">{comment.content}</p>
          <div className="comment__actions">
            {!isReply && user && (
              <button
                type="button"
                onClick={() => {
                  setReplyTo(replyTo === comment.id ? null : comment.id)
                  setReplyContent('')
                }}
              >
                <CornerDownRight size={14} />
                回复
              </button>
            )}
            {canDelete && (
              <button type="button" onClick={() => setDeleteTarget(comment)}>
                <Trash2 size={14} />
                删除
              </button>
            )}
          </div>

          {replyTo === comment.id && user && (
            <form className="comment-reply-form" onSubmit={(event) => submitReply(event, comment.id)}>
              <textarea
                className="textarea"
                value={replyContent}
                onChange={(event) => setReplyContent(event.target.value)}
                placeholder={`回复 @${comment.user.username}…`}
                maxLength={800}
                rows={3}
                autoFocus
              />
              <div className="comment-reply-form__actions">
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => setReplyTo(null)}>
                  取消
                </button>
                <button type="submit" className="btn btn--primary btn--sm" disabled={replySubmitting}>
                  {replySubmitting && <Loader2 size={14} className="spin" />}
                  送出回复
                </button>
              </div>
            </form>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div className="comment__replies">
              {comment.replies.map((reply) => renderComment(reply, true))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <section className="comments" id="comments" aria-labelledby="comments-title">
      <div className="comments__head">
        <h2 id="comments-title">
          <MessageCircle size={21} />
          回应
        </h2>
        <span>{countLabel}</span>
      </div>

      {user ? (
        <form className="comment-form" onSubmit={submit}>
          <Avatar name={user.username} src={user.avatarUrl} size="md" />
          <div className="comment-form__main">
            <textarea
              className="textarea comment-form__textarea"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="读过之后，想说点什么？"
              maxLength={800}
              rows={4}
            />
            <div className="comment-form__foot">
              <span>{content.length} / 800</span>
              <button type="submit" className="btn btn--primary btn--sm" disabled={submitting || !content.trim()}>
                {submitting ? <Loader2 size={15} className="spin" /> : <Send size={15} />}
                留下回应
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="comment-login">
          <span className="comment-login__icon">
            <Lock size={18} />
          </span>
          <p>登录后就可以留下你的回应，和作者一起把话题继续下去。</p>
          <Link
            to="/login"
            state={{ from: `${location.pathname}${location.search}` }}
            className="btn btn--primary btn--sm"
          >
            登录参与
          </Link>
        </div>
      )}

      {loading ? (
        <InlineLoader label="正在翻开留言…" />
      ) : comments.length === 0 ? (
        <EmptyState
          title="这里还很安静"
          description="做第一个回应的人，让这篇文字听见回声。"
          icon={<MessageCircle size={28} />}
        />
      ) : (
        <div className="comments__list">{comments.map((comment) => renderComment(comment))}</div>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="删除这条评论？"
        message="删除后无法恢复，它下面的回复也会一并消失。"
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </section>
  )
}
