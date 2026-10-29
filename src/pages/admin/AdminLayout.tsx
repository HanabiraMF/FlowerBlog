import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react'
import { Avatar } from '../../components/Avatar'
import { Brand, FlowerMark } from '../../components/Brand'
import { useAuth } from '../../context/AuthContext'
import { useSite } from '../../context/SiteContext'
import { useToast } from '../../context/ToastContext'

const navItems = [
  { to: '/admin', label: '概览', icon: LayoutDashboard, end: true },
  { to: '/admin/posts', label: '文章管理', icon: FileText, end: false },
  { to: '/admin/comments', label: '评论管理', icon: MessageSquare, end: false },
  { to: '/admin/users', label: '用户管理', icon: Users, end: false },
  { to: '/admin/settings', label: '站点设置', icon: Settings, end: false },
]

const pageTitles: Record<string, { title: string; eyebrow: string }> = {
  '/admin': { title: '花园概览', eyebrow: 'OVERVIEW' },
  '/admin/posts': { title: '文章管理', eyebrow: 'STORIES' },
  '/admin/comments': { title: '评论管理', eyebrow: 'COMMENTS' },
  '/admin/users': { title: '用户管理', eyebrow: 'PEOPLE' },
  '/admin/settings': { title: '站点设置', eyebrow: 'SETTINGS' },
}

export function AdminLayout() {
  const { user, logout } = useAuth()
  const { site } = useSite()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const current = pageTitles[location.pathname] ?? { title: '管理后台', eyebrow: 'ADMIN' }

  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.title = `${current.title} · ${site.siteName} 管理后台`
  }, [current.title, site.siteName])

  async function handleLogout() {
    await logout()
    toast('已退出管理后台')
    navigate('/')
  }

  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar ${drawerOpen ? 'is-open' : ''}`}>
        <div className="admin-sidebar__head">
          <Brand light />
          <button className="icon-button admin-sidebar__close" type="button" onClick={() => setDrawerOpen(false)} aria-label="关闭菜单">
            <X size={20} />
          </button>
        </div>
        <span className="admin-sidebar__label">WORKSPACE</span>
        <nav className="admin-nav" aria-label="后台导航">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `admin-nav__item ${isActive ? 'is-active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                <span className="admin-nav__dot" />
              </NavLink>
            )
          })}
        </nav>

        <div className="admin-sidebar__spacer" />
        <div className="admin-sidebar__quote">
          <FlowerMark size={38} />
          <p>“让每一篇文字，都有被认真对待的角落。”</p>
        </div>
        <Link to="/" className="admin-sidebar__back">
          <ArrowLeft size={16} />
          返回网站
        </Link>
        <div className="admin-sidebar__user">
          <Avatar name={user?.username ?? '管理员'} src={user?.avatarUrl} size="sm" />
          <div>
            <strong>{user?.username}</strong>
            <span>管理员</span>
          </div>
          <button type="button" onClick={handleLogout} aria-label="退出登录">
            <LogOut size={16} />
          </button>
        </div>
        <FlowerMark size={240} className="admin-sidebar__watermark" />
      </aside>

      {drawerOpen && <button type="button" className="admin-sidebar__backdrop" onClick={() => setDrawerOpen(false)} aria-label="关闭菜单" />}

      <div className="admin-body">
        <header className="admin-topbar">
          <div className="admin-topbar__left">
            <button type="button" className="icon-button admin-topbar__menu" onClick={() => setDrawerOpen(true)} aria-label="打开菜单">
              <Menu size={21} />
            </button>
            <div>
              <span className="eyebrow">{current.eyebrow}</span>
              <h1>{current.title}</h1>
            </div>
          </div>
          <div className="admin-topbar__right">
            <span className="admin-topbar__badge">
              <ShieldCheck size={14} />
              管理权限
            </span>
            <Link to="/write" className="btn btn--primary btn--sm">
              写新文章
            </Link>
          </div>
        </header>
        <main className="admin-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
