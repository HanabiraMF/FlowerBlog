import type { D1Database } from '@cloudflare/workers-types'
import type {
  AdminCommentRow,
  Author,
  Comment,
  CommentStatus,
  PostDetail,
  PostStatus,
  PostSummary,
  Role,
  SiteSettings,
} from '../shared/types'

export const POST_LIST_SELECT = `
  SELECT p.id, p.slug, p.title, p.excerpt, p.cover_url, p.tags, p.status,
         p.featured, p.views, p.created_at, p.updated_at, p.published_at,
         LENGTH(p.content) AS content_length,
         u.id AS author_id, u.username AS author_username,
         u.avatar_url AS author_avatar, u.bio AS author_bio, u.role AS author_role,
         (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND c.status = 'approved') AS comment_count
  FROM posts p
  JOIN users u ON u.id = p.author_id
`

export const POST_DETAIL_SELECT = `
  SELECT p.id, p.slug, p.title, p.excerpt, p.content, p.cover_url, p.tags, p.status,
         p.featured, p.views, p.created_at, p.updated_at, p.published_at,
         LENGTH(p.content) AS content_length,
         u.id AS author_id, u.username AS author_username,
         u.avatar_url AS author_avatar, u.bio AS author_bio, u.role AS author_role,
         (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND c.status = 'approved') AS comment_count
  FROM posts p
  JOIN users u ON u.id = p.author_id
`

export interface PostRow {
  id: string
  slug: string
  title: string
  excerpt: string
  content?: string
  cover_url: string | null
  tags: string
  status: PostStatus
  featured: number
  views: number
  created_at: string
  updated_at: string
  published_at: string | null
  content_length: number
  author_id: string
  author_username: string
  author_avatar: string | null
  author_bio: string
  author_role: Role
  comment_count: number
}

function parseTags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === 'string') : []
  } catch {
    return []
  }
}

export function readingMinutes(length: number): number {
  return Math.max(1, Math.ceil(length / 320))
}

export function mapPost(row: PostRow): PostSummary {
  const author: Author = {
    id: row.author_id,
    username: row.author_username,
    avatarUrl: row.author_avatar,
    bio: row.author_bio,
    role: row.author_role,
  }
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    coverUrl: row.cover_url,
    tags: parseTags(row.tags),
    featured: Boolean(row.featured),
    status: row.status,
    views: row.views,
    readingMinutes: readingMinutes(Number(row.content_length) || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
    author,
    commentCount: Number(row.comment_count) || 0,
  }
}

export function mapPostDetail(row: PostRow): PostDetail {
  return { ...mapPost(row), content: row.content ?? '' }
}

export interface CommentRow {
  id: string
  content: string
  parent_id: string | null
  status: CommentStatus
  created_at: string
  user_id: string
  username: string
  avatar_url: string | null
  bio: string
  role: Role
  post_title?: string
  post_slug?: string
}

export function mapComment(row: CommentRow): Comment {
  return {
    id: row.id,
    content: row.content,
    parentId: row.parent_id,
    status: row.status,
    createdAt: row.created_at,
    user: {
      id: row.user_id,
      username: row.username,
      avatarUrl: row.avatar_url,
      bio: row.bio,
      role: row.role,
    },
  }
}

export function mapAdminComment(row: CommentRow): AdminCommentRow {
  return {
    ...mapComment(row),
    postTitle: row.post_title ?? '',
    postSlug: row.post_slug ?? '',
  }
}

const SETTING_DEFAULTS: Record<string, string> = {
  site_name: 'FlowerBlog',
  tagline: '在字里行间，种下一朵花。',
  description: '一个关于生活、灵感与生长的文字花园。',
  footer_text: '在喧嚣的世界里，留一块安静的地方，让文字慢慢发芽。',
  about_body: '',
  comments_moderation: 'false',
}

export async function readSettings(db: D1Database): Promise<SiteSettings> {
  const result = await db.prepare('SELECT key, value FROM settings').all<{
    key: string
    value: string
  }>()
  const settings = { ...SETTING_DEFAULTS }
  for (const row of result.results ?? []) settings[row.key] = row.value
  return {
    siteName: settings.site_name,
    tagline: settings.tagline,
    description: settings.description,
    footerText: settings.footer_text,
    aboutBody: settings.about_body,
    commentsModeration: settings.comments_moderation === 'true',
  }
}

export function slugify(title: string): string {
  const base = title
    .normalize('NFKC')
    .toLowerCase()
    .replace(/['’"]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
  const suffix = crypto.randomUUID().slice(0, 6)
  return base ? `${base}-${suffix}` : `story-${suffix}`
}

export function excerptFromMarkdown(markdown: string, length = 120): string {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  return plain.length > length ? `${plain.slice(0, length).trim()}…` : plain
}

export function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const raw of tags) {
    const tag = raw.replace(/^#/, '').trim().slice(0, 24)
    if (!tag) continue
    const key = tag.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(tag)
    if (result.length >= 5) break
  }
  return result
}
