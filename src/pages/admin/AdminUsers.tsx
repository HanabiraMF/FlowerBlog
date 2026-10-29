import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Shield,
  ShieldOff,
  UserCheck,
  UserX,
} from 'lucide-react'
import type { AdminUser, Paginated } from '../../../shared/types'
import { api, errorMessage } from '../../api'
import { Avatar } from '../../components/Avatar'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { EmptyState, InlineLoader } from '../../components/Loading'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { formatNumber, formatShortDate, roleLabel } from '../../lib/format'

export function AdminUsers() {
  const { user: me } = useAuth()
  const { toast } = useToast()
  const [items, setItems] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [statusTarget, setStatusTarget] = useState<AdminUser | null>(null)
  const [updating, setUpdating] = useState(false)
  const pageSize = 20

  const load = useCallback(
    async (targetPage = 1) => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        params.set('page', String(targetPage))
        params.set('pageSize', String(pageSize))
        if (query) params.set('q', query)
        const data = await api.get<Paginated<AdminUser>>(`/api/admin/users?${params.toString()}`)
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
    [query, toast],
  )

  useEffect(() => {
    void load(1)
  }, [load])

  function submitSearch(event: FormEvent) {
    event.preventDefault()
    setQuery(search.trim())
  }

  async function updateUser(
    targetUser: AdminUser,
    changes: { role?: 'user' | 'admin'; status?: 'active' | 'disabled' },
    message: string,
  ) {
    setBusyId(targetUser.id)
    try {
      await api.patch(`/api/admin/users/${targetUser.id}`, changes)
      toast(message)
      await load(page)
    } catch (error) {
      toast(errorMessage(error), 'error')
    } finally {
      setBusyId(null)
    }
  }

  async function confirmStatusChange() {
    if (!statusTarget) return
    setUpdating(true)
    const nextStatus = statusTarget.status === 'active' ? 'disabled' : 'active'
    try {
      await api.patch(`/api/admin/users/${statusTarget.id}`, { status: nextStatus })
      toast(nextStatus === 'disabled' ? '账号已停用' : '账号已恢复')
      setStatusTarget(null)
      await load(page)
    } catch (error) {
      toast(errorMessage(error), 'error')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page__toolbar">
        <form className="admin-search admin-search--wide" onSubmit={submitSearch}>
          <Search size={16} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="搜索用户名或邮箱"
            aria-label="搜索用户"
          />
          <button type="submit" className="btn btn--ghost btn--xs">搜索</button>
        </form>
        <p className="admin-page__count">共 <strong>{total}</strong> 位</p>
      </div>

      {loading ? (
        <InlineLoader label="正在点名…" />
      ) : items.length === 0 ? (
        <EmptyState title="没有找到用户" description="换一个关键词试试，或者等待新的读者到来。" />
      ) : (
        <div className="admin-table-wrap admin-table-wrap--card">
          <table className="admin-table admin-table--users">
            <thead>
              <tr>
                <th>用户</th>
                <th>角色</th>
                <th>状态</th>
                <th>创作</th>
                <th>加入时间</th>
                <th aria-label="操作" />
              </tr>
            </thead>
            <tbody>
              {items.map((user) => {
                const isSelf = user.id === me?.id
                const isDemo = user.role === 'demo'
                return (
                  <tr key={user.id}>
                    <td>
                      <div className="admin-user-cell">
                        <Avatar name={user.username} src={user.avatarUrl} size="sm" />
                        <div>
                          <Link to={`/u/${encodeURIComponent(user.username)}`} className="admin-table__title">
                            {user.username}
                            {isSelf && <span className="admin-self-badge">你</span>}
                          </Link>
                          <span className="admin-table__sub">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`role-pill role-pill--${user.role}`}>
                        {user.role === 'admin' && <Shield size={12} />}
                        {roleLabel(user.role)}
                      </span>
                    </td>
                    <td>
                      <span className={`user-status user-status--${user.status}`}>
                        <span />
                        {user.status === 'active' ? '正常' : '已停用'}
                      </span>
                    </td>
                    <td>
                      <span className="admin-table__data">
                        {formatNumber(user.postCount)} 篇
                        <span className="dot" />
                        {formatNumber(user.commentCount)} 评
                      </span>
                    </td>
                    <td>{formatShortDate(user.createdAt)}</td>
                    <td>
                      <div className="admin-row-actions">
                        {busyId === user.id ? (
                          <Loader2 size={17} className="spin" />
                        ) : isSelf || isDemo ? (
                          <span className="admin-table__muted">{isDemo ? '示例账号' : '当前账号'}</span>
                        ) : (
                          <>
                            <button
                              type="button"
                              title={user.role === 'admin' ? '降为普通用户' : '设为管理员'}
                              onClick={() =>
                                void updateUser(
                                  user,
                                  { role: user.role === 'admin' ? 'user' : 'admin' },
                                  user.role === 'admin' ? '已取消管理员权限' : '已设为管理员',
                                )
                              }
                            >
                              {user.role === 'admin' ? <ShieldOff size={16} /> : <Shield size={16} />}
                            </button>
                            <button
                              type="button"
                              title={user.status === 'active' ? '停用账号' : '恢复账号'}
                              className={user.status === 'active' ? 'is-danger' : ''}
                              onClick={() => setStatusTarget(user)}
                            >
                              {user.status === 'active' ? <UserX size={16} /> : <UserCheck size={16} />}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
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
        open={Boolean(statusTarget)}
        title={statusTarget?.status === 'active' ? '停用这个账号？' : '恢复这个账号？'}
        message={
          statusTarget?.status === 'active'
            ? <>停用后，<strong>{statusTarget?.username}</strong> 将无法登录，已有会话也会失效。文章和评论会保留。</>
            : <><strong>{statusTarget?.username}</strong> 将可以重新登录 FlowerBlog。</>
        }
        confirmLabel={statusTarget?.status === 'active' ? '确认停用' : '恢复账号'}
        danger={statusTarget?.status === 'active'}
        loading={updating}
        onCancel={() => setStatusTarget(null)}
        onConfirm={confirmStatusChange}
      />
    </div>
  )
}
