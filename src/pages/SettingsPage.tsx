import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AtSign, KeyRound, Loader2, Mail, ShieldCheck, UserRound } from 'lucide-react'
import { api, errorMessage } from '../api'
import { Avatar } from '../components/Avatar'
import { ImageUploader } from '../components/ImageUploader'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { roleLabel } from '../lib/format'
import { usePageTitle } from '../lib/usePageTitle'
import type { AuthUser } from '../../shared/types'

export function SettingsPage() {
  const { user, setUser } = useAuth()
  const { toast } = useToast()
  usePageTitle('个人设置')
  const [username, setUsername] = useState(user?.username ?? '')
  const [bio, setBio] = useState(user?.bio ?? '')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl ?? null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    if (!user) return
    setUsername(user.username)
    setBio(user.bio)
    setAvatarUrl(user.avatarUrl)
  }, [user])

  async function saveProfile(event: FormEvent) {
    event.preventDefault()
    setSavingProfile(true)
    try {
      const data = await api.patch<{ user: AuthUser }>('/api/me', {
        username: username.trim(),
        bio,
        avatarUrl,
      })
      setUser(data.user)
      toast('个人资料已更新')
    } catch (error) {
      toast(errorMessage(error), 'error')
    } finally {
      setSavingProfile(false)
    }
  }

  async function savePassword(event: FormEvent) {
    event.preventDefault()
    if (newPassword.length < 8) {
      toast('新密码至少需要 8 位', 'error')
      return
    }
    if (newPassword !== confirmPassword) {
      toast('两次输入的新密码不一致', 'error')
      return
    }
    setSavingPassword(true)
    try {
      await api.post('/api/me/password', { currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast('密码已更新，其他设备需要重新登录')
    } catch (error) {
      toast(errorMessage(error), 'error')
    } finally {
      setSavingPassword(false)
    }
  }

  if (!user) return null

  return (
    <div className="settings-page">
      <section className="page-hero page-hero--compact">
        <div className="container page-hero__inner">
          <span className="eyebrow">
            <span className="eyebrow__line" />
            YOUR PROFILE
          </span>
          <h1>打理你的<em>小花园</em>。</h1>
          <p>换一个喜欢的头像，写两句自我介绍，让读到文字的人更认识你一点。</p>
        </div>
      </section>

      <div className="container settings-layout">
        <aside className="settings-aside">
          <div className="settings-profile">
            <Avatar name={user.username} src={avatarUrl} size="xl" />
            <h2>{user.username}</h2>
            <span className="badge">{roleLabel(user.role)}</span>
            <p>{bio || '还没有写下自我介绍。'}</p>
            <Link to={`/u/${encodeURIComponent(user.username)}`} className="text-link">
              查看我的主页
            </Link>
          </div>
          <nav className="settings-nav" aria-label="设置导航">
            <a href="#profile">
              <UserRound size={16} />
              个人资料
            </a>
            <a href="#security">
              <ShieldCheck size={16} />
              账号安全
            </a>
          </nav>
          <div className="settings-aside__note">
            <ShieldCheck size={17} />
            <p>你的密码会经过 PBKDF2 加密后保存，FlowerBlog 不会读取明文密码。</p>
          </div>
        </aside>

        <div className="settings-main">
          <section className="settings-card" id="profile">
            <div className="settings-card__head">
              <div>
                <h2>个人资料</h2>
                <p>这些信息会显示在你的作者主页和文章下方。</p>
              </div>
              <UserRound size={22} />
            </div>
            <form onSubmit={saveProfile} className="settings-form">
              <ImageUploader
                value={avatarUrl}
                onChange={setAvatarUrl}
                label="头像"
                hint="建议使用正方形图片，最大 5MB"
                variant="avatar"
              />
              <div className="form-grid">
                <label className="field">
                  <span className="field__label">用户名</span>
                  <span className="field__control">
                    <AtSign size={16} />
                    <input
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      minLength={2}
                      maxLength={24}
                      required
                    />
                  </span>
                  <span className="field__hint">修改后作者主页地址也会一起变化。</span>
                </label>
                <label className="field">
                  <span className="field__label">邮箱</span>
                  <span className="field__control field__control--disabled">
                    <Mail size={16} />
                    <input value={user.email} readOnly />
                  </span>
                  <span className="field__hint">邮箱暂不支持修改。</span>
                </label>
              </div>
              <label className="field">
                <span className="field__label">个人简介</span>
                <textarea
                  className="textarea"
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  maxLength={200}
                  rows={4}
                  placeholder="用一两句话介绍自己，比如：喜欢植物、旧书和下雨天。"
                />
                <span className="field__hint">{bio.length} / 200</span>
              </label>
              <div className="settings-form__actions">
                <button type="submit" className="btn btn--primary btn--sm" disabled={savingProfile}>
                  {savingProfile && <Loader2 size={15} className="spin" />}
                  保存资料
                </button>
              </div>
            </form>
          </section>

          <section className="settings-card" id="security">
            <div className="settings-card__head">
              <div>
                <h2>账号安全</h2>
                <p>定期更换密码，是照顾自己的一个小习惯。</p>
              </div>
              <KeyRound size={22} />
            </div>
            <form onSubmit={savePassword} className="settings-form">
              <label className="field">
                <span className="field__label">当前密码</span>
                <span className="field__control">
                  <KeyRound size={16} />
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </span>
              </label>
              <div className="form-grid">
                <label className="field">
                  <span className="field__label">新密码</span>
                  <span className="field__control">
                    <KeyRound size={16} />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                  </span>
                </label>
                <label className="field">
                  <span className="field__label">确认新密码</span>
                  <span className="field__control">
                    <KeyRound size={16} />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                  </span>
                </label>
              </div>
              <div className="settings-form__actions">
                <button type="submit" className="btn btn--primary btn--sm" disabled={savingPassword}>
                  {savingPassword && <Loader2 size={15} className="spin" />}
                  更新密码
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  )
}
