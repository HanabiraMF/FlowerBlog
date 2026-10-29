import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  PenLine,
  Search,
  Settings,
  Shield,
  UserRound,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSite } from '../context/SiteContext'
import { useToast } from '../context/ToastContext'
import { Avatar } from './Avatar'
import { Brand } from './Brand'

const navItems = [
  { to: '/', label: '首页', end: true },
  { to: '/explore', label: '发现', end: false },
  { to: '/about', label: '关于', end: false },
]

export function Header() {
  const { user, logout } = useAuth()
  const { site } = useSite()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setAccountOpen(false)
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => {
    if (!mobileOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [mobileOpen])

  async function handleLogout() {
    await logout()
    toast('已安全退出')
    navigate('/')
  }

  return (
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="container header__inner">
        <Brand />

        <nav className="header__nav" aria-label="主导航">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="header__actions">
          <Link to="/explore" className="icon-button header__search" aria-label="搜索文章">
            <Search size={19} />
          </Link>

          {user ? (
            <>
              <Link to="/write" className="btn btn--ink btn--sm header__write">
                <PenLine size={16} />
                写文章
              </Link>
              <div className="account" ref={accountRef}>
                <button
                  type="button"
                  className={`account__trigger ${accountOpen ? 'is-open' : ''}`}
                  onClick={() => setAccountOpen((open) => !open)}
                  aria-expanded={accountOpen}
                  aria-haspopup="menu"
                >
                  <Avatar name={user.username} src={user.avatarUrl} size="sm" />
                  <ChevronDown size={14} />
                </button>
                {accountOpen && (
                  <div className="account-menu" role="menu">
                    <div className="account-menu__head">
                      <Avatar name={user.username} src={user.avatarUrl} size="md" />
                      <div>
                        <strong>{user.username}</strong>
                        <span>{user.email}</span>
                      </div>
                    </div>
                    <div className="account-menu__links">
                      <Link to={`/u/${encodeURIComponent(user.username)}`} role="menuitem">
                        <UserRound size={16} />
                        我的主页
                      </Link>
                      <Link to="/dashboard" role="menuitem">
                        <LayoutDashboard size={16} />
                        创作台
                      </Link>
                      <Link to="/settings" role="menuitem">
                        <Settings size={16} />
                        个人设置
                      </Link>
                      {user.role === 'admin' && (
                        <Link to="/admin" role="menuitem" className="account-menu__admin">
                          <Shield size={16} />
                          管理后台
                        </Link>
                      )}
                    </div>
                    <button type="button" className="account-menu__logout" onClick={handleLogout}>
                      <LogOut size={16} />
                      退出登录
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="header__login">
                登录
              </Link>
              <Link to="/register" className="btn btn--primary btn--sm">
                开始写作
              </Link>
            </>
          )}

          <button
            type="button"
            className="icon-button mobile-toggle"
            onClick={() => setMobileOpen(true)}
            aria-label="打开菜单"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      <div className={`mobile-drawer ${mobileOpen ? 'is-open' : ''}`} aria-hidden={!mobileOpen}>
        <div className="mobile-drawer__head">
          <Brand />
          <button
            type="button"
            className="icon-button"
            onClick={() => setMobileOpen(false)}
            aria-label="关闭菜单"
          >
            <X size={22} />
          </button>
        </div>
        <p className="mobile-drawer__tagline">{site.tagline}</p>
        <nav className="mobile-drawer__nav" aria-label="移动端导航">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}>
              {item.label}
            </NavLink>
          ))}
          {user ? (
            <>
              <NavLink to="/write">写文章</NavLink>
              <NavLink to="/dashboard">创作台</NavLink>
              <NavLink to="/settings">个人设置</NavLink>
              {user.role === 'admin' && <NavLink to="/admin">管理后台</NavLink>}
              <button type="button" onClick={handleLogout} className="mobile-drawer__logout">
                退出登录
              </button>
            </>
          ) : (
            <div className="mobile-drawer__auth">
              <Link to="/login" className="btn btn--ghost">
                登录
              </Link>
              <Link to="/register" className="btn btn--primary">
                开始写作
              </Link>
            </div>
          )}
        </nav>
        <div className="mobile-drawer__foot">
          <span>© {new Date().getFullYear()} {site.siteName}</span>
          <span>用文字种花</span>
        </div>
      </div>
      {mobileOpen && (
        <button
          type="button"
          className="mobile-drawer__backdrop"
          onClick={() => setMobileOpen(false)}
          aria-label="关闭菜单"
        />
      )}
    </header>
  )
}
