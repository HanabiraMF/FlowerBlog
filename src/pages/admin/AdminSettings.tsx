import { useEffect, useState, type FormEvent } from 'react'
import { Cloud, Flower2, Loader2, Save, Sparkles, Trash2 } from 'lucide-react'
import type { SiteSettings } from '../../../shared/types'
import { api, errorMessage } from '../../api'
import { FlowerMark } from '../../components/Brand'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { FullPageLoader } from '../../components/Loading'
import { useSite } from '../../context/SiteContext'
import { useToast } from '../../context/ToastContext'

export function AdminSettings() {
  const { setSite } = useSite()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [removingDemo, setRemovingDemo] = useState(false)
  const [demoDialog, setDemoDialog] = useState(false)
  const [form, setForm] = useState<SiteSettings>({
    siteName: '',
    tagline: '',
    description: '',
    footerText: '',
    aboutBody: '',
    commentsModeration: false,
  })

  useEffect(() => {
    let alive = true
    api
      .get<SiteSettings>('/api/admin/settings')
      .then((data) => {
        if (alive) setForm(data)
      })
      .catch((error) => toast(errorMessage(error), 'error'))
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [toast])

  function update<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    try {
      const data = await api.put<SiteSettings>('/api/admin/settings', form)
      setForm(data)
      setSite(data)
      toast('站点设置已保存')
    } catch (error) {
      toast(errorMessage(error), 'error')
    } finally {
      setSaving(false)
    }
  }

  async function removeDemo() {
    setRemovingDemo(true)
    try {
      const result = await api.post<{ removedPosts: number }>('/api/admin/demo/remove')
      toast(`已移除 ${result.removedPosts} 篇示例文章`)
      setDemoDialog(false)
      window.setTimeout(() => window.location.reload(), 600)
    } catch (error) {
      toast(errorMessage(error), 'error')
    } finally {
      setRemovingDemo(false)
    }
  }

  if (loading) return <FullPageLoader label="正在打开设置册…" />

  return (
    <form className="admin-settings" onSubmit={save}>
      <div className="admin-settings__grid">
        <div className="admin-settings__main">
          <section className="admin-card admin-settings__card">
            <div className="admin-card__head">
              <div>
                <span className="eyebrow">BASIC INFO</span>
                <h3>基本信息</h3>
              </div>
              <Flower2 size={19} />
            </div>
            <div className="admin-form-grid">
              <label className="field">
                <span className="field__label">站点名称</span>
                <input
                  className="input"
                  value={form.siteName}
                  onChange={(event) => update('siteName', event.target.value)}
                  maxLength={40}
                  required
                />
              </label>
              <label className="field">
                <span className="field__label">一句话标语</span>
                <input
                  className="input"
                  value={form.tagline}
                  onChange={(event) => update('tagline', event.target.value)}
                  maxLength={120}
                />
              </label>
            </div>
            <label className="field">
              <span className="field__label">站点简介</span>
              <textarea
                className="textarea"
                value={form.description}
                onChange={(event) => update('description', event.target.value)}
                maxLength={500}
                rows={4}
              />
              <span className="field__hint">显示在首页首屏和关于页面。</span>
            </label>
          </section>

          <section className="admin-card admin-settings__card">
            <div className="admin-card__head">
              <div>
                <span className="eyebrow">ABOUT PAGE</span>
                <h3>关于页面</h3>
              </div>
              <Sparkles size={19} />
            </div>
            <label className="field">
              <span className="field__label">关于页面正文（支持 Markdown）</span>
              <textarea
                className="textarea textarea--code"
                value={form.aboutBody}
                onChange={(event) => update('aboutBody', event.target.value)}
                rows={14}
              />
            </label>
          </section>

          <section className="admin-card admin-settings__card">
            <div className="admin-card__head">
              <div>
                <span className="eyebrow">COMMENTS</span>
                <h3>评论设置</h3>
              </div>
            </div>
            <label className="switch-row">
              <span>
                <strong>开启评论审核</strong>
                <small>开启后，新评论需要管理员在后台通过才会公开显示。</small>
              </span>
              <input
                type="checkbox"
                checked={form.commentsModeration}
                onChange={(event) => update('commentsModeration', event.target.checked)}
              />
              <span className="switch" aria-hidden="true" />
            </label>
            <label className="field">
              <span className="field__label">页脚文字</span>
              <input
                className="input"
                value={form.footerText}
                onChange={(event) => update('footerText', event.target.value)}
                maxLength={300}
              />
            </label>
          </section>

          <section className="admin-card admin-settings__card admin-settings__danger">
            <div className="admin-card__head">
              <div>
                <span className="eyebrow">DEMO CONTENT</span>
                <h3>示例内容</h3>
              </div>
              <Trash2 size={19} />
            </div>
            <p>
              当前站点预置了示例作者、文章和评论，方便你预览效果。正式启用前，可以在这里一键移除它们。
              你自己的账号和文章不会受到影响。
            </p>
            <button
              type="button"
              className="btn btn--danger btn--sm"
              onClick={() => setDemoDialog(true)}
            >
              <Trash2 size={15} />
              移除全部示例内容
            </button>
          </section>
        </div>

        <aside className="admin-settings__aside">
          <div className="admin-preview-card">
            <span className="eyebrow">LIVE PREVIEW</span>
            <div className="admin-preview-card__brand">
              <FlowerMark size={42} />
              <strong>{form.siteName || 'FlowerBlog'}</strong>
            </div>
            <p>{form.tagline || '在字里行间，种下一朵花。'}</p>
            <div className="admin-preview-card__line" />
            <span className="admin-preview-card__foot">首页预览</span>
          </div>

          <div className="admin-settings__note">
            <Cloud size={19} />
            <div>
              <strong>免费部署在 Cloudflare</strong>
              <p>FlowerBlog 使用 Workers、D1 与 R2 构建，完全运行在 Cloudflare 免费套餐的额度内。</p>
            </div>
          </div>

          <div className="admin-settings__save">
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
              保存所有设置
            </button>
            <p>保存后，站点名称和文案会立即更新。</p>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={demoDialog}
        title="移除全部示例内容？"
        message="示例作者、文章和评论将被永久删除，无法恢复。你创建的文章会保留。"
        confirmLabel="确认移除"
        loading={removingDemo}
        onCancel={() => setDemoDialog(false)}
        onConfirm={removeDemo}
      />
    </form>
  )
}
