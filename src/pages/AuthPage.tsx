import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { Brand, FlowerMark } from '../components/Brand'
import { useAuth } from '../context/AuthContext'
import { useSite } from '../context/SiteContext'
import { useToast } from '../context/ToastContext'
import { errorMessage } from '../api'

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { user, loading, login, register } = useAuth()
  const { site } = useSite()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from || '/'
  const isLogin = mode === 'login'

  const [identifier, setIdentifier] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && user) navigate(from, { replace: true })
  }, [loading, user, from, navigate])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!isLogin && password.length < 8) {
      setError('密码至少需要 8 位')
      return
    }
    setSubmitting(true)
    try {
      if (isLogin) {
        await login(identifier.trim(), password)
        toast('欢迎回来')
        navigate(from, { replace: true })
      } else {
        const result = await register(username.trim(), email.trim(), password)
        if (result.isFirstAdmin) {
          toast('欢迎，你已成为这座花园的管理员')
        } else {
          toast('账号创建成功，欢迎来到花园')
        }
        navigate(from, { replace: true })
      }
    } catch (submitError) {
      setError(errorMessage(submitError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="auth-panel__top">
          <Brand />
          <Link to="/" className="auth-back">
            <ArrowLeft size={15} />
            回到首页
          </Link>
        </div>

        <div className="auth-card">
          <span className="eyebrow">
            <span className="eyebrow__line" />
            {isLogin ? 'WELCOME BACK' : 'JOIN THE GARDEN'}
          </span>
          <h1>{isLogin ? '欢迎回到花园。' : '来种下你的第一朵花。'}</h1>
          <p className="auth-card__lead">
            {isLogin
              ? '登录后继续书写、回应，和这片小天地保持联系。'
              : '创建账号，收藏喜欢的文字，也让你的故事被看见。'}
          </p>

          {error && <div className="form-error" role="alert">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            {isLogin ? (
              <label className="field">
                <span className="field__label">用户名或邮箱</span>
                <span className="field__control">
                  <UserRound size={17} />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="username"
                    required
                    autoFocus
                  />
                </span>
              </label>
            ) : (
              <>
                <label className="field">
                  <span className="field__label">你的名字</span>
                  <span className="field__control">
                    <UserRound size={17} />
                    <input
                      type="text"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="给自己取一个名字"
                      autoComplete="username"
                      minLength={2}
                      maxLength={24}
                      required
                      autoFocus
                    />
                  </span>
                </label>
                <label className="field">
                  <span className="field__label">邮箱</span>
                  <span className="field__control">
                    <Mail size={17} />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                    />
                  </span>
                </label>
              </>
            )}

            <label className="field">
              <span className="field__label">密码</span>
              <span className="field__control">
                <LockKeyhole size={17} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={isLogin ? '输入你的密码' : '至少 8 位字符'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  minLength={isLogin ? 1 : 8}
                  required
                />
                <button
                  type="button"
                  className="field__action"
                  onClick={() => setShowPassword((show) => !show)}
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </span>
            </label>

            <button type="submit" className="btn btn--primary auth-submit" disabled={submitting}>
              {submitting ? <Loader2 size={17} className="spin" /> : <Sparkles size={17} />}
              {submitting ? '请稍候…' : isLogin ? '进入花园' : '创建账号'}
              {!submitting && <ArrowRight size={17} />}
            </button>
          </form>

          {!isLogin && (
            <p className="auth-hint">
              <FlowerMark size={16} />
              第一位注册的用户将成为 FlowerBlog 的管理员。
            </p>
          )}

          <p className="auth-switch">
            {isLogin ? '还没有账号？' : '已经有账号了？'}
            <Link to={isLogin ? '/register' : '/login'} state={{ from }}>
              {isLogin ? '创建一个' : '去登录'}
            </Link>
          </p>
        </div>

        <p className="auth-legal">注册即表示你愿意温柔地对待这里的文字与每一个路过的人。</p>
      </div>

      <aside className="auth-art">
        <img src="/demo/auth-garden.svg" alt="" className="auth-art__image" />
        <div className="auth-art__overlay" />
        <div className="auth-art__top">
          <span className="auth-art__label">FLOWERBLOG · A QUIET CORNER</span>
          <FlowerMark size={38} />
        </div>
        <div className="auth-art__quote">
          <span className="auth-art__quote-mark">“</span>
          <blockquote>
            让文字慢慢经过，
            <br />
            像风穿过一座花园。
          </blockquote>
          <span className="auth-art__from">— {site.siteName}</span>
        </div>
        <div className="auth-art__bottom">
          <span>写下来，就有了归处。</span>
          <span className="auth-art__index">01 / 01</span>
        </div>
      </aside>
    </div>
  )
}
