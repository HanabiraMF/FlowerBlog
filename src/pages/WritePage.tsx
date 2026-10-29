import { useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Bold,
  Eye,
  Heading2,
  ImagePlus,
  Italic,
  Link2,
  List,
  Loader2,
  PenLine,
  Quote,
  Save,
  Send,
  Sparkles,
  Tag,
  X,
} from 'lucide-react'
import type { PostDetail } from '../../shared/types'
import { api, errorMessage } from '../api'
import { Brand, FlowerMark } from '../components/Brand'
import { ImageUploader } from '../components/ImageUploader'
import { FullPageLoader } from '../components/Loading'
import { Markdown } from '../components/Markdown'
import { useToast } from '../context/ToastContext'
import { readingLabel, timeAgo } from '../lib/format'
import { usePageTitle } from '../lib/usePageTitle'

export function WritePage() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const { toast } = useToast()
  const [loading, setLoading] = useState(editing)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [tab, setTab] = useState<'write' | 'preview'>('write')
  const [saving, setSaving] = useState<null | 'draft' | 'publish'>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [loadedPost, setLoadedPost] = useState<PostDetail | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const lastSelection = useRef({ start: 0, end: 0 })
  usePageTitle(editing ? '编辑文章' : '写文章')

  useEffect(() => {
    if (!id) return
    let alive = true
    api
      .get<PostDetail>(`/api/me/posts/${id}`)
      .then((post) => {
        if (!alive) return
        setLoadedPost(post)
        setTitle(post.title)
        setContent(post.content)
        setExcerpt(post.excerpt)
        setCoverUrl(post.coverUrl)
        setTags(post.tags)
        setStatus(post.status)
      })
      .catch((error) => {
        toast(errorMessage(error), 'error')
        navigate('/dashboard', { replace: true })
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [id, navigate, toast])

  const stats = useMemo(() => {
    const characters = content.replace(/\s/g, '').length
    const minutes = Math.max(1, Math.ceil(content.length / 320))
    return { characters, minutes }
  }, [content])

  function rememberSelection() {
    const textarea = textareaRef.current
    if (textarea) {
      lastSelection.current = {
        start: textarea.selectionStart,
        end: textarea.selectionEnd,
      }
    }
  }

  function insertText(before: string, after = '', placeholder = '') {
    const textarea = textareaRef.current
    if (!textarea) {
      setContent((current) => `${current}${before}${placeholder}${after}`)
      return
    }
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = content.slice(start, end) || placeholder
    const next = `${content.slice(0, start)}${before}${selected}${after}${content.slice(end)}`
    setContent(next)
    window.setTimeout(() => {
      textarea.focus()
      const cursorStart = start + before.length
      textarea.setSelectionRange(cursorStart, cursorStart + selected.length)
    }, 0)
  }

  function insertBlock(prefix: string) {
    const textarea = textareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const lineStart = content.lastIndexOf('\n', start - 1) + 1
    const next = `${content.slice(0, lineStart)}${prefix}${content.slice(lineStart)}`
    setContent(next)
    window.setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + prefix.length, start + prefix.length)
    }, 0)
  }

  function addTag(raw: string) {
    const tag = raw.replace(/^#/, '').trim().slice(0, 24)
    if (!tag) return
    if (tags.length >= 5) {
      toast('最多添加 5 个标签', 'error')
      return
    }
    if (tags.some((item) => item.toLowerCase() === tag.toLowerCase())) {
      setTagInput('')
      return
    }
    setTags((current) => [...current, tag])
    setTagInput('')
  }

  function onTagKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addTag(tagInput)
    }
    if (event.key === 'Backspace' && !tagInput && tags.length) {
      setTags((current) => current.slice(0, -1))
    }
  }

  async function handleInlineImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUploadingImage(true)
    try {
      const result = await api.upload(file)
      const textarea = textareaRef.current
      const start = textarea ? textarea.selectionStart : lastSelection.current.start
      const end = textarea ? textarea.selectionEnd : lastSelection.current.end
      const snippet = `\n![图片描述](${result.url})\n`
      setContent((current) => `${current.slice(0, start)}${snippet}${current.slice(end)}`)
      toast('图片已插入正文')
      window.setTimeout(() => textareaRef.current?.focus(), 0)
    } catch (error) {
      toast(errorMessage(error), 'error')
    } finally {
      setUploadingImage(false)
    }
  }

  async function save(nextStatus: 'draft' | 'published') {
    if (saving) return
    if (title.trim().length < 2) {
      toast('先给文章起一个至少 2 个字的名字', 'error')
      return
    }
    if (!content.trim()) {
      toast('正文还空着，写点什么吧', 'error')
      return
    }
    setSaving(nextStatus === 'published' ? 'publish' : 'draft')
    try {
      const payload = {
        title: title.trim(),
        content,
        excerpt: excerpt.trim() || undefined,
        coverUrl,
        tags,
        status: nextStatus,
      }
      const post = editing
        ? await api.patch<PostDetail>(`/api/posts/${id}`, payload)
        : await api.post<PostDetail>('/api/posts', payload)
      setStatus(nextStatus)
      setLoadedPost(post)
      toast(nextStatus === 'published' ? '文章已发布，去看看吧' : '草稿已保存')
      if (nextStatus === 'published') {
        navigate(`/post/${post.slug}`)
      } else {
        navigate('/dashboard')
      }
    } catch (error) {
      toast(errorMessage(error), 'error')
    } finally {
      setSaving(null)
    }
  }

  if (loading) return <FullPageLoader label="正在打开稿纸…" />

  const topActionLabel = status === 'published' && editing ? '更新文章' : '发布文章'

  return (
    <div className="editor-page">
      <header className="editor-topbar">
        <div className="container editor-topbar__inner">
          <div className="editor-topbar__left">
            <Brand showWordmark />
            <span className="editor-topbar__divider" />
            <Link to="/dashboard" className="editor-back">
              <ArrowLeft size={16} />
              创作台
            </Link>
          </div>
          <div className="editor-topbar__center">
            <span className={`status-pill status-pill--${status}`}>
              <span />
              {status === 'published' ? '已发布' : '草稿'}
            </span>
            {loadedPost && <span className="editor-topbar__saved">上次保存：{timeAgo(loadedPost.updatedAt)}</span>}
          </div>
          <div className="editor-topbar__actions">
            <button
              type="button"
              className="btn btn--primary btn--sm"
              disabled={Boolean(saving)}
              onClick={() => void save(status)}
            >
              {saving ? (
                <Loader2 size={15} className="spin" />
              ) : status === 'published' ? (
                <Send size={15} />
              ) : (
                <Save size={15} />
              )}
              {status === 'published' ? topActionLabel : '保存草稿'}
            </button>
          </div>
        </div>
      </header>

      <div className="container editor-shell">
        <main className="editor-main">
          <div className="editor-heading">
            <span className="eyebrow">
              <span className="eyebrow__line" />
              {editing ? 'REVISE YOUR STORY' : 'A NEW STORY'}
            </span>
            <textarea
              className="editor-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="给这篇文章起一个名字"
              rows={1}
              maxLength={120}
              aria-label="文章标题"
            />
            <div className="editor-title__meta">
              <span>{title.length} / 120</span>
              <span>标题可以慢慢想</span>
            </div>
          </div>

          <div className="editor-card">
            <div className="editor-card__toolbar">
              <div className="editor-tools">
                <button type="button" aria-label="加粗" title="加粗" onClick={() => insertText('**', '**', '加粗文字')}>
                  <Bold size={17} />
                </button>
                <button type="button" aria-label="斜体" title="斜体" onClick={() => insertText('*', '*', '斜体文字')}>
                  <Italic size={17} />
                </button>
                <button type="button" aria-label="二级标题" title="二级标题" onClick={() => insertBlock('## ')}>
                  <Heading2 size={17} />
                </button>
                <button type="button" aria-label="引用" title="引用" onClick={() => insertBlock('> ')}>
                  <Quote size={17} />
                </button>
                <button type="button" aria-label="列表" title="列表" onClick={() => insertBlock('- ')}>
                  <List size={17} />
                </button>
                <button
                  type="button"
                  aria-label="插入链接"
                  title="插入链接"
                  onClick={() => insertText('[', '](https://)', '链接文字')}
                >
                  <Link2 size={17} />
                </button>
                <button
                  type="button"
                  aria-label="上传并插入图片"
                  title="上传图片"
                  onClick={() => {
                    rememberSelection()
                    imageInputRef.current?.click()
                  }}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? <Loader2 size={17} className="spin" /> : <ImagePlus size={17} />}
                </button>
              </div>
              <div className="editor-tabs">
                <button type="button" className={tab === 'write' ? 'is-active' : ''} onClick={() => setTab('write')}>
                  <PenLine size={15} />
                  写作
                </button>
                <button type="button" className={tab === 'preview' ? 'is-active' : ''} onClick={() => setTab('preview')}>
                  <Eye size={15} />
                  预览
                </button>
              </div>
            </div>

            {tab === 'write' ? (
              <textarea
                ref={textareaRef}
                className="editor-textarea"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder={'从这里开始，写下你想说的话…\n\n支持 Markdown：**加粗**、*斜体*、## 标题、> 引用、- 列表。也可以直接上传图片插入正文。'}
                spellCheck={false}
              />
            ) : (
              <div className="editor-preview">
                {content.trim() ? (
                  <Markdown content={content} />
                ) : (
                  <div className="editor-preview__empty">
                    <FlowerMark size={38} />
                    <p>写下些什么，这里就会开出花来。</p>
                  </div>
                )}
              </div>
            )}

            <div className="editor-card__footer">
              <span>{content.length} 个字符 · {stats.characters} 字</span>
              <span>{readingLabel(stats.minutes)}</span>
            </div>
          </div>

          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            hidden
            onChange={(event) => void handleInlineImage(event)}
          />
        </main>

        <aside className="editor-sidebar">
          <section className="editor-panel">
            <div className="editor-panel__head">
              <h2>
                <Sparkles size={16} />
                发布设置
              </h2>
            </div>
            <div className="editor-panel__body">
              <div className="editor-status-options">
                <button
                  type="button"
                  className={status === 'draft' ? 'is-active' : ''}
                  onClick={() => setStatus('draft')}
                >
                  <span className="radio-dot" />
                  <div>
                    <strong>草稿</strong>
                    <small>只有自己可见，随时继续写</small>
                  </div>
                </button>
                <button
                  type="button"
                  className={status === 'published' ? 'is-active' : ''}
                  onClick={() => setStatus('published')}
                >
                  <span className="radio-dot" />
                  <div>
                    <strong>发布</strong>
                    <small>公开在花园里，接受温柔回应</small>
                  </div>
                </button>
              </div>
            </div>
          </section>

          <section className="editor-panel">
            <div className="editor-panel__head">
              <h2>封面图片</h2>
              <span>可选</span>
            </div>
            <div className="editor-panel__body">
              <ImageUploader value={coverUrl} onChange={setCoverUrl} label="" hint="建议 16:10，最大 5MB" />
            </div>
          </section>

          <section className="editor-panel">
            <div className="editor-panel__head">
              <h2>
                <Tag size={15} />
                标签
              </h2>
              <span>{tags.length} / 5</span>
            </div>
            <div className="editor-panel__body">
              <div className="tag-input">
                <div className="tag-input__chips">
                  {tags.map((tag) => (
                    <span key={tag}>
                      #{tag}
                      <button type="button" onClick={() => setTags((current) => current.filter((item) => item !== tag))} aria-label={`移除标签 ${tag}`}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  <input
                    value={tagInput}
                    onChange={(event) => setTagInput(event.target.value)}
                    onKeyDown={onTagKeyDown}
                    onBlur={() => addTag(tagInput)}
                    placeholder={tags.length ? '添加…' : '输入后按回车'}
                    maxLength={24}
                    aria-label="添加标签"
                  />
                </div>
              </div>
              <p className="field__hint">好的标签，会让对的人更容易找到它。</p>
            </div>
          </section>

          <section className="editor-panel">
            <div className="editor-panel__head">
              <h2>文章摘要</h2>
              <span>可选</span>
            </div>
            <div className="editor-panel__body">
              <textarea
                className="textarea"
                value={excerpt}
                onChange={(event) => setExcerpt(event.target.value)}
                placeholder="用一两句话介绍这篇文章，不填会自动从正文生成。"
                maxLength={320}
                rows={4}
              />
              <p className="field__hint">{excerpt.length} / 320</p>
            </div>
          </section>

          <section className="editor-tip">
            <FlowerMark size={24} />
            <div>
              <strong>写不下去的时候</strong>
              <p>先写一段最想说的话，剩下的会慢慢长出来。草稿随时可以回来继续。</p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
