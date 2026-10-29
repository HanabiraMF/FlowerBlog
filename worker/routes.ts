import { Hono } from 'hono'
import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { z } from 'zod'
import type { AppEnv } from './types'
import {
  clearSession,
  createSession,
  hashPassword,
  randomId,
  verifyPassword,
} from './auth'
import {
  POST_DETAIL_SELECT,
  POST_LIST_SELECT,
  excerptFromMarkdown,
  mapAdminComment,
  mapComment,
  mapPost,
  mapPostDetail,
  normalizeTags,
  readSettings,
  slugify,
  type CommentRow,
  type PostRow,
} from './db'
import type {
  AdminCommentRow,
  AdminStats,
  AdminUser,
  AuthUser,
  AuthorPageData,
  HomeData,
  Paginated,
  PostDetail,
  PostStatus,
  PostSummary,
  Role,
  SiteSettings,
} from '../shared/types'

const app = new Hono<AppEnv>()

function fail(c: Context<AppEnv>, message: string, status: ContentfulStatusCode = 400) {
  return c.json({ error: message }, status)
}

function requireUser(c: Context<AppEnv>): AuthUser | null {
  return c.get('user')
}

function pagination(c: Context<AppEnv>, defaultSize = 9) {
  const page = Math.max(1, Number.parseInt(c.req.query('page') || '1', 10) || 1)
  const pageSize = Math.min(
    30,
    Math.max(1, Number.parseInt(c.req.query('pageSize') || String(defaultSize), 10) || defaultSize),
  )
  return { page, pageSize, offset: (page - 1) * pageSize }
}

function safeImageUrl(value: string | null | undefined): string | null {
  if (!value) return null
  const url = value.trim()
  if (!url) return null
  if (url.startsWith('/') && !url.startsWith('//')) return url.slice(0, 500)
  if (/^https?:\/\//i.test(url)) return url.slice(0, 500)
  return null
}

const usernamePattern = /^[\p{L}\p{N}_-]+$/u
const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, '用户名至少需要 2 个字符')
    .max(24, '用户名不能超过 24 个字符')
    .regex(usernamePattern, '用户名只能包含文字、数字、下划线或短横线'),
  email: z.string().trim().toLowerCase().email('请输入有效的邮箱地址').max(120),
  password: z.string().min(8, '密码至少需要 8 位').max(128, '密码过长'),
})

const loginSchema = z.object({
  identifier: z.string().trim().min(1, '请输入用户名或邮箱'),
  password: z.string().min(1, '请输入密码'),
})

const postCreateSchema = z.object({
  title: z.string().trim().min(2, '标题至少需要 2 个字符').max(120, '标题不能超过 120 个字符'),
  excerpt: z.string().trim().max(320, '摘要不能超过 320 个字符').optional(),
  content: z.string().trim().min(1, '正文不能为空').max(120_000, '正文过长'),
  coverUrl: z.string().max(500).nullable().optional(),
  tags: z.array(z.string()).max(10).optional(),
  status: z.enum(['draft', 'published']).default('draft'),
})

const postUpdateSchema = postCreateSchema.partial()

const commentSchema = z.object({
  content: z.string().trim().min(1, '写点什么吧').max(800, '评论不能超过 800 个字符'),
  parentId: z.string().max(80).nullable().optional(),
})

const profileSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, '用户名至少需要 2 个字符')
    .max(24, '用户名不能超过 24 个字符')
    .regex(usernamePattern, '用户名只能包含文字、数字、下划线或短横线')
    .optional(),
  bio: z.string().trim().max(200, '简介不能超过 200 个字符').optional(),
  avatarUrl: z.string().max(500).nullable().optional(),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, '请输入当前密码'),
  newPassword: z.string().min(8, '新密码至少需要 8 位').max(128),
})

const settingsSchema = z.object({
  siteName: z.string().trim().min(1, '站点名称不能为空').max(40).optional(),
  tagline: z.string().trim().max(120).optional(),
  description: z.string().trim().max(500).optional(),
  footerText: z.string().trim().max(300).optional(),
  aboutBody: z.string().max(20_000).optional(),
  commentsModeration: z.boolean().optional(),
})

const adminPostSchema = z.object({
  status: z.enum(['draft', 'published']).optional(),
  featured: z.boolean().optional(),
})

const adminCommentSchema = z.object({
  status: z.enum(['approved', 'pending', 'rejected']),
})

const adminUserSchema = z.object({
  role: z.enum(['user', 'admin']).optional(),
  status: z.enum(['active', 'disabled']).optional(),
})

/* ------------------------------------------------------------------ */
/* Public: site, home, posts, authors, comments                        */
/* ------------------------------------------------------------------ */

app.get('/api/site', async (c) => {
  const site = await readSettings(c.env.DB)
  return c.json(site)
})

app.get('/api/home', async (c) => {
  const DB = c.env.DB
  const [featuredRow, latestResult, trendingResult, tagsResult, postCount, writerCount, commentCount, site] =
    await Promise.all([
      DB.prepare(
        `${POST_LIST_SELECT} WHERE p.status = 'published' AND p.featured = 1
         ORDER BY COALESCE(p.published_at, p.created_at) DESC LIMIT 1`,
      ).first<PostRow>(),
      DB.prepare(
        `${POST_LIST_SELECT} WHERE p.status = 'published'
         ORDER BY COALESCE(p.published_at, p.created_at) DESC LIMIT 7`,
      ).all<PostRow>(),
      DB.prepare(
        `${POST_LIST_SELECT} WHERE p.status = 'published'
         ORDER BY p.views DESC, COALESCE(p.published_at, p.created_at) DESC LIMIT 5`,
      ).all<PostRow>(),
      DB.prepare("SELECT tags FROM posts WHERE status = 'published'").all<{ tags: string }>(),
      DB.prepare("SELECT COUNT(*) AS n FROM posts WHERE status = 'published'").first<{ n: number }>(),
      DB.prepare(
        "SELECT COUNT(DISTINCT author_id) AS n FROM posts WHERE status = 'published'",
      ).first<{
        n: number
      }>(),
      DB.prepare("SELECT COUNT(*) AS n FROM comments WHERE status = 'approved'").first<{
        n: number
      }>(),
      readSettings(DB),
    ])

  const latestAll = (latestResult.results ?? []).map(mapPost)
  const featured = featuredRow ? mapPost(featuredRow) : (latestAll[0] ?? null)
  const latest = latestAll.filter((post) => post.id !== featured?.id).slice(0, 6)
  const trending = (trendingResult.results ?? [])
    .map(mapPost)
    .filter((post) => post.id !== featured?.id)
    .slice(0, 4)

  const tagMap = new Map<string, number>()
  for (const row of tagsResult.results ?? []) {
    try {
      const parsed = JSON.parse(row.tags)
      if (!Array.isArray(parsed)) continue
      for (const tag of parsed) {
        if (typeof tag === 'string') tagMap.set(tag, (tagMap.get(tag) ?? 0) + 1)
      }
    } catch {
      // Ignore malformed legacy tags.
    }
  }
  const tags = [...tagMap.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'zh-CN'))
    .slice(0, 12)

  const data: HomeData = {
    featured,
    latest,
    trending,
    tags,
    stats: {
      posts: postCount?.n ?? 0,
      writers: writerCount?.n ?? 0,
      comments: commentCount?.n ?? 0,
    },
    site,
  }
  return c.json(data)
})

app.get('/api/posts', async (c) => {
  const DB = c.env.DB
  const { page, pageSize, offset } = pagination(c)
  const q = (c.req.query('q') || '').trim().slice(0, 80)
  const tag = (c.req.query('tag') || '').trim().slice(0, 24)
  const author = (c.req.query('author') || '').trim().slice(0, 24)
  const sort = c.req.query('sort') === 'popular' ? 'popular' : 'latest'

  const where: string[] = ["p.status = 'published'"]
  const binds: unknown[] = []

  if (q) {
    where.push('(p.title LIKE ? OR p.excerpt LIKE ? OR p.content LIKE ?)')
    binds.push(`%${q}%`, `%${q}%`, `%${q}%`)
  }
  if (tag) {
    where.push('p.tags LIKE ?')
    binds.push(`%"${tag}"%`)
  }
  if (author) {
    where.push('lower(u.username) = lower(?)')
    binds.push(author)
  }

  const whereSql = where.join(' AND ')
  const orderSql =
    sort === 'popular'
      ? 'p.views DESC, COALESCE(p.published_at, p.created_at) DESC'
      : 'COALESCE(p.published_at, p.created_at) DESC'

  const [rows, count] = await Promise.all([
    DB.prepare(`${POST_LIST_SELECT} WHERE ${whereSql} ORDER BY ${orderSql} LIMIT ? OFFSET ?`)
      .bind(...binds, pageSize, offset)
      .all<PostRow>(),
    DB.prepare(
      `SELECT COUNT(*) AS n FROM posts p JOIN users u ON u.id = p.author_id WHERE ${whereSql}`,
    )
      .bind(...binds)
      .first<{ n: number }>(),
  ])

  const total = Number(count?.n) || 0
  const data: Paginated<PostSummary> = {
    items: (rows.results ?? []).map(mapPost),
    total,
    page,
    pageSize,
    hasMore: offset + (rows.results?.length ?? 0) < total,
  }
  return c.json(data)
})

app.get('/api/posts/:slug', async (c) => {
  const DB = c.env.DB
  const slug = c.req.param('slug')
  const row = await DB.prepare(`${POST_DETAIL_SELECT} WHERE p.slug = ?`).bind(slug).first<PostRow>()
  if (!row) return fail(c, '文章不存在或已被删除', 404)

  const viewer = requireUser(c)
  if (row.status !== 'published') {
    if (!viewer || (viewer.id !== row.author_id && viewer.role !== 'admin')) {
      return fail(c, '文章不存在或尚未发布', 404)
    }
  } else {
    const viewDate = new Date().toISOString().slice(0, 10)
    await DB.batch([
      DB.prepare('UPDATE posts SET views = views + 1 WHERE id = ?').bind(row.id),
      DB.prepare(
        `INSERT INTO post_views (post_id, view_date, views) VALUES (?, ?, 1)
         ON CONFLICT(post_id, view_date) DO UPDATE SET views = views + 1`,
      ).bind(row.id, viewDate),
    ])
    row.views += 1
  }

  const data: PostDetail = mapPostDetail(row)
  return c.json(data)
})

app.get('/api/users/:username', async (c) => {
  const DB = c.env.DB
  const username = c.req.param('username')
  const user = await DB.prepare(
    `SELECT id, username, avatar_url, bio, role, created_at
     FROM users WHERE lower(username) = lower(?) AND status = 'active'`,
  )
    .bind(username)
    .first<{
      id: string
      username: string
      avatar_url: string | null
      bio: string
      role: Role
      created_at: string
    }>()
  if (!user) return fail(c, '没有找到这位作者', 404)

  const [posts, stats] = await Promise.all([
    DB.prepare(
      `${POST_LIST_SELECT} WHERE p.author_id = ? AND p.status = 'published'
       ORDER BY COALESCE(p.published_at, p.created_at) DESC LIMIT 24`,
    )
      .bind(user.id)
      .all<PostRow>(),
    DB.prepare(
      `SELECT COUNT(*) AS posts, COALESCE(SUM(views), 0) AS views
       FROM posts WHERE author_id = ? AND status = 'published'`,
    )
      .bind(user.id)
      .first<{ posts: number; views: number }>(),
  ])

  const data: AuthorPageData = {
    user: {
      id: user.id,
      username: user.username,
      avatarUrl: user.avatar_url,
      bio: user.bio,
      role: user.role,
      createdAt: user.created_at,
    },
    posts: (posts.results ?? []).map(mapPost),
    stats: { posts: Number(stats?.posts) || 0, views: Number(stats?.views) || 0 },
  }
  return c.json(data)
})

app.get('/api/posts/:slug/comments', async (c) => {
  const DB = c.env.DB
  const post = await DB.prepare("SELECT id FROM posts WHERE slug = ? AND status = 'published'")
    .bind(c.req.param('slug'))
    .first<{ id: string }>()
  if (!post) return fail(c, '文章不存在或尚未发布', 404)

  const result = await DB.prepare(
    `SELECT c.id, c.content, c.parent_id, c.status, c.created_at,
            u.id AS user_id, u.username, u.avatar_url, u.bio, u.role
     FROM comments c JOIN users u ON u.id = c.user_id
     WHERE c.post_id = ? AND c.status = 'approved'
     ORDER BY c.created_at ASC`,
  )
    .bind(post.id)
    .all<CommentRow>()

  const all = (result.results ?? []).map(mapComment)
  const byId = new Map(all.map((comment) => [comment.id, { ...comment, replies: [] as typeof all }]))
  const roots: typeof all = []
  for (const comment of byId.values()) {
    if (comment.parentId && byId.has(comment.parentId)) {
      byId.get(comment.parentId)!.replies!.push(comment)
    } else {
      roots.push(comment)
    }
  }
  return c.json({ items: roots, total: all.length })
})

app.post('/api/posts/:slug/comments', async (c) => {
  const user = requireUser(c)
  if (!user) return fail(c, '登录后即可留下评论', 401)

  const body = await c.req.json().catch(() => null)
  const parsed = commentSchema.safeParse(body)
  if (!parsed.success) return fail(c, parsed.error.issues[0]?.message || '评论格式有误')

  const DB = c.env.DB
  const post = await DB.prepare("SELECT id FROM posts WHERE slug = ? AND status = 'published'")
    .bind(c.req.param('slug'))
    .first<{ id: string }>()
  if (!post) return fail(c, '文章不存在或尚未发布', 404)

  let parentId = parsed.data.parentId ?? null
  if (parentId) {
    const parent = await DB.prepare('SELECT id, parent_id FROM comments WHERE id = ? AND post_id = ?')
      .bind(parentId, post.id)
      .first<{ id: string; parent_id: string | null }>()
    if (!parent) return fail(c, '要回复的评论不存在', 404)
    parentId = parent.parent_id ?? parent.id
  }

  const last = await DB.prepare(
    'SELECT created_at FROM comments WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
  )
    .bind(user.id)
    .first<{ created_at: string }>()
  if (last && Date.now() - new Date(last.created_at).getTime() < 10_000) {
    return fail(c, '评论得太快啦，稍等几秒再发', 429)
  }

  const settings = await readSettings(DB)
  const status = settings.commentsModeration ? 'pending' : 'approved'
  const id = randomId('cmt_')
  const now = new Date().toISOString()
  await DB.prepare(
    `INSERT INTO comments (id, post_id, user_id, parent_id, content, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, post.id, user.id, parentId, parsed.data.content, status, now)
    .run()

  return c.json(
    {
      comment: {
        id,
        content: parsed.data.content,
        parentId,
        status,
        createdAt: now,
        user: {
          id: user.id,
          username: user.username,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          role: user.role,
        },
      },
      pending: status === 'pending',
    },
    201,
  )
})

app.delete('/api/comments/:id', async (c) => {
  const user = requireUser(c)
  if (!user) return fail(c, '请先登录', 401)
  const DB = c.env.DB
  const comment = await DB.prepare('SELECT id, user_id FROM comments WHERE id = ?')
    .bind(c.req.param('id'))
    .first<{ id: string; user_id: string }>()
  if (!comment) return fail(c, '评论不存在', 404)
  if (comment.user_id !== user.id && user.role !== 'admin') {
    return fail(c, '没有权限删除这条评论', 403)
  }
  await DB.batch([
    DB.prepare('DELETE FROM comments WHERE parent_id = ?').bind(comment.id),
    DB.prepare('DELETE FROM comments WHERE id = ?').bind(comment.id),
  ])
  return c.json({ ok: true })
})

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

app.post('/api/auth/register', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) return fail(c, parsed.error.issues[0]?.message || '注册信息有误')

  const { username, email, password } = parsed.data
  const DB = c.env.DB
  const existing = await DB.prepare(
    'SELECT id FROM users WHERE lower(email) = lower(?) OR lower(username) = lower(?) LIMIT 1',
  )
    .bind(email, username)
    .first()
  if (existing) return fail(c, '这个用户名或邮箱已经被使用了', 409)

  const adminCount = await DB.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'").first<{
    n: number
  }>()
  const role: Role = (Number(adminCount?.n) || 0) === 0 ? 'admin' : 'user'
  const { hash, salt } = await hashPassword(password)
  const id = randomId('usr_')
  const now = new Date().toISOString()

  try {
    await DB.prepare(
      `INSERT INTO users (id, username, email, password_hash, password_salt, role, status, bio, avatar_url, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'active', '', NULL, ?, ?)`,
    )
      .bind(id, username, email, hash, salt, role, now, now)
      .run()
  } catch {
    return fail(c, '这个用户名或邮箱已经被使用了', 409)
  }

  await createSession(c, id)
  const user: AuthUser = {
    id,
    username,
    email,
    role,
    bio: '',
    avatarUrl: null,
    createdAt: now,
  }
  return c.json({ user, isFirstAdmin: role === 'admin' }, 201)
})

app.post('/api/auth/login', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) return fail(c, parsed.error.issues[0]?.message || '登录信息有误')

  const DB = c.env.DB
  const row = await DB.prepare(
    `SELECT id, username, email, password_hash, password_salt, role, status, bio, avatar_url, created_at
     FROM users WHERE lower(email) = lower(?) OR lower(username) = lower(?) LIMIT 1`,
  )
    .bind(parsed.data.identifier, parsed.data.identifier)
    .first<{
      id: string
      username: string
      email: string
      password_hash: string
      password_salt: string
      role: Role
      status: string
      bio: string
      avatar_url: string | null
      created_at: string
    }>()

  if (!row || row.role === 'demo') return fail(c, '账号或密码不正确', 401)
  if (row.status !== 'active') return fail(c, '该账号已被停用，请联系管理员', 403)

  const valid = await verifyPassword(parsed.data.password, row.password_salt, row.password_hash)
  if (!valid) return fail(c, '账号或密码不正确', 401)

  await createSession(c, row.id)
  const user: AuthUser = {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
  }
  return c.json({ user })
})

app.post('/api/auth/logout', async (c) => {
  await clearSession(c)
  return c.json({ ok: true })
})

app.get('/api/auth/me', async (c) => {
  return c.json({ user: c.get('user') })
})

/* ------------------------------------------------------------------ */
/* Current user                                                        */
/* ------------------------------------------------------------------ */

app.patch('/api/me', async (c) => {
  const user = requireUser(c)
  if (!user) return fail(c, '请先登录', 401)
  const body = await c.req.json().catch(() => null)
  const parsed = profileSchema.safeParse(body)
  if (!parsed.success) return fail(c, parsed.error.issues[0]?.message || '资料格式有误')

  const DB = c.env.DB
  const updates: string[] = []
  const binds: unknown[] = []

  if (parsed.data.username !== undefined && parsed.data.username !== user.username) {
    const taken = await DB.prepare('SELECT id FROM users WHERE lower(username) = lower(?) AND id != ?')
      .bind(parsed.data.username, user.id)
      .first()
    if (taken) return fail(c, '这个用户名已经被使用了', 409)
    updates.push('username = ?')
    binds.push(parsed.data.username)
  }
  if (parsed.data.bio !== undefined) {
    updates.push('bio = ?')
    binds.push(parsed.data.bio)
  }
  if (parsed.data.avatarUrl !== undefined) {
    updates.push('avatar_url = ?')
    binds.push(safeImageUrl(parsed.data.avatarUrl))
  }

  const now = new Date().toISOString()
  if (updates.length) {
    updates.push('updated_at = ?')
    binds.push(now)
    await DB.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...binds, user.id)
      .run()
  }

  const fresh = await DB.prepare(
    'SELECT id, username, email, role, bio, avatar_url, created_at FROM users WHERE id = ?',
  )
    .bind(user.id)
    .first<{
      id: string
      username: string
      email: string
      role: Role
      bio: string
      avatar_url: string | null
      created_at: string
    }>()
  const updated: AuthUser = {
    id: fresh!.id,
    username: fresh!.username,
    email: fresh!.email,
    role: fresh!.role,
    bio: fresh!.bio,
    avatarUrl: fresh!.avatar_url,
    createdAt: fresh!.created_at,
  }
  return c.json({ user: updated })
})

app.post('/api/me/password', async (c) => {
  const user = requireUser(c)
  if (!user) return fail(c, '请先登录', 401)
  const body = await c.req.json().catch(() => null)
  const parsed = passwordSchema.safeParse(body)
  if (!parsed.success) return fail(c, parsed.error.issues[0]?.message || '密码格式有误')

  const DB = c.env.DB
  const row = await DB.prepare('SELECT password_hash, password_salt FROM users WHERE id = ?')
    .bind(user.id)
    .first<{ password_hash: string; password_salt: string }>()
  if (!row) return fail(c, '用户不存在', 404)
  const valid = await verifyPassword(parsed.data.currentPassword, row.password_salt, row.password_hash)
  if (!valid) return fail(c, '当前密码不正确', 400)

  const { hash, salt } = await hashPassword(parsed.data.newPassword)
  await DB.batch([
    DB.prepare('UPDATE users SET password_hash = ?, password_salt = ?, updated_at = ? WHERE id = ?').bind(
      hash,
      salt,
      new Date().toISOString(),
      user.id,
    ),
    DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id),
  ])
  await createSession(c, user.id)
  return c.json({ ok: true })
})

app.get('/api/me/posts', async (c) => {
  const user = requireUser(c)
  if (!user) return fail(c, '请先登录', 401)
  const result = await c.env.DB.prepare(
    `${POST_LIST_SELECT} WHERE p.author_id = ? ORDER BY p.updated_at DESC`,
  )
    .bind(user.id)
    .all<PostRow>()
  return c.json({ items: (result.results ?? []).map(mapPost) })
})

app.get('/api/me/posts/:id', async (c) => {
  const user = requireUser(c)
  if (!user) return fail(c, '请先登录', 401)
  const row = await c.env.DB.prepare(`${POST_DETAIL_SELECT} WHERE p.id = ?`)
    .bind(c.req.param('id'))
    .first<PostRow>()
  if (!row) return fail(c, '文章不存在', 404)
  if (row.author_id !== user.id && user.role !== 'admin') return fail(c, '没有权限查看这篇文章', 403)
  return c.json(mapPostDetail(row))
})

/* ------------------------------------------------------------------ */
/* Writing                                                             */
/* ------------------------------------------------------------------ */

function validateCover(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  const safe = safeImageUrl(value)
  if (!safe) throw new Error('封面地址无效')
  return safe
}

app.post('/api/posts', async (c) => {
  const user = requireUser(c)
  if (!user) return fail(c, '请先登录', 401)
  const body = await c.req.json().catch(() => null)
  const parsed = postCreateSchema.safeParse(body)
  if (!parsed.success) return fail(c, parsed.error.issues[0]?.message || '文章格式有误')

  let cover: string | null | undefined
  try {
    cover = validateCover(parsed.data.coverUrl)
  } catch (error) {
    return fail(c, error instanceof Error ? error.message : '封面地址无效')
  }

  const DB = c.env.DB
  const now = new Date().toISOString()
  const id = randomId('post_')
  const slug = slugify(parsed.data.title)
  const tags = normalizeTags(parsed.data.tags ?? [])
  const excerpt = parsed.data.excerpt?.trim() || excerptFromMarkdown(parsed.data.content)
  const publishedAt = parsed.data.status === 'published' ? now : null

  await DB.prepare(
    `INSERT INTO posts
      (id, slug, title, excerpt, content, cover_url, tags, status, featured, views, author_id, created_at, updated_at, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      slug,
      parsed.data.title,
      excerpt,
      parsed.data.content,
      cover ?? null,
      JSON.stringify(tags),
      parsed.data.status,
      user.id,
      now,
      now,
      publishedAt,
    )
    .run()

  const row = await DB.prepare(`${POST_DETAIL_SELECT} WHERE p.id = ?`).bind(id).first<PostRow>()
  return c.json(mapPostDetail(row!), 201)
})

app.patch('/api/posts/:id', async (c) => {
  const user = requireUser(c)
  if (!user) return fail(c, '请先登录', 401)
  const body = await c.req.json().catch(() => null)
  const parsed = postUpdateSchema.safeParse(body)
  if (!parsed.success) return fail(c, parsed.error.issues[0]?.message || '文章格式有误')

  const DB = c.env.DB
  const existing = await DB.prepare('SELECT id, author_id, status, published_at FROM posts WHERE id = ?')
    .bind(c.req.param('id'))
    .first<{ id: string; author_id: string; status: PostStatus; published_at: string | null }>()
  if (!existing) return fail(c, '文章不存在', 404)
  if (existing.author_id !== user.id && user.role !== 'admin') return fail(c, '没有权限编辑这篇文章', 403)

  const updates: string[] = []
  const binds: unknown[] = []
  const now = new Date().toISOString()

  if (parsed.data.title !== undefined) {
    updates.push('title = ?')
    binds.push(parsed.data.title)
  }
  if (parsed.data.content !== undefined) {
    updates.push('content = ?')
    binds.push(parsed.data.content)
  }
  if (parsed.data.excerpt !== undefined) {
    updates.push('excerpt = ?')
    binds.push(
      parsed.data.excerpt.trim() ||
        excerptFromMarkdown(parsed.data.content ?? ''),
    )
  }
  if (parsed.data.coverUrl !== undefined) {
    let cover: string | null | undefined
    try {
      cover = validateCover(parsed.data.coverUrl)
    } catch (error) {
      return fail(c, error instanceof Error ? error.message : '封面地址无效')
    }
    updates.push('cover_url = ?')
    binds.push(cover ?? null)
  }
  if (parsed.data.tags !== undefined) {
    updates.push('tags = ?')
    binds.push(JSON.stringify(normalizeTags(parsed.data.tags)))
  }
  if (parsed.data.status !== undefined) {
    updates.push('status = ?')
    binds.push(parsed.data.status)
    if (parsed.data.status === 'published' && existing.status !== 'published') {
      updates.push('published_at = ?')
      binds.push(now)
    }
  }

  updates.push('updated_at = ?')
  binds.push(now)
  await DB.prepare(`UPDATE posts SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...binds, existing.id)
    .run()

  const row = await DB.prepare(`${POST_DETAIL_SELECT} WHERE p.id = ?`).bind(existing.id).first<PostRow>()
  return c.json(mapPostDetail(row!))
})

app.delete('/api/posts/:id', async (c) => {
  const user = requireUser(c)
  if (!user) return fail(c, '请先登录', 401)
  const DB = c.env.DB
  const post = await DB.prepare('SELECT id, author_id FROM posts WHERE id = ?')
    .bind(c.req.param('id'))
    .first<{ id: string; author_id: string }>()
  if (!post) return fail(c, '文章不存在', 404)
  if (post.author_id !== user.id && user.role !== 'admin') return fail(c, '没有权限删除这篇文章', 403)

  await DB.batch([
    DB.prepare('DELETE FROM comments WHERE post_id = ?').bind(post.id),
    DB.prepare('DELETE FROM post_views WHERE post_id = ?').bind(post.id),
    DB.prepare('DELETE FROM posts WHERE id = ?').bind(post.id),
  ])
  return c.json({ ok: true })
})

/* ------------------------------------------------------------------ */
/* Uploads                                                             */
/* ------------------------------------------------------------------ */

const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
}

app.post('/api/uploads', async (c) => {
  const user = requireUser(c)
  if (!user) return fail(c, '请先登录', 401)

  let form: FormData
  try {
    form = await c.req.formData()
  } catch {
    return fail(c, '上传数据格式有误')
  }
  const file = form.get('file')
  if (!(file instanceof File)) return fail(c, '请选择一张图片')
  if (!IMAGE_TYPES[file.type]) return fail(c, '仅支持 JPG、PNG、WebP、GIF 或 AVIF 图片')
  if (file.size > 5 * 1024 * 1024) return fail(c, '图片不能超过 5MB')

  const buffer = await file.arrayBuffer()
  if (!buffer.byteLength) return fail(c, '图片文件为空')
  const ext = IMAGE_TYPES[file.type]
  const date = new Date().toISOString().slice(0, 10)
  const key = `uploads/${user.id}/${date}/${crypto.randomUUID()}.${ext}`

  try {
    await c.env.IMAGES.put(key, buffer, {
      httpMetadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return fail(c, '图片存储暂时不可用，请稍后重试', 500)
  }

  return c.json({ url: `/api/images/${key}`, key }, 201)
})

/* ------------------------------------------------------------------ */
/* Admin                                                               */
/* ------------------------------------------------------------------ */

app.use('/api/admin/*', async (c, next) => {
  const user = c.get('user')
  if (!user) return fail(c, '请先登录', 401)
  if (user.role !== 'admin') return fail(c, '需要管理员权限', 403)
  await next()
})

app.get('/api/admin/stats', async (c) => {
  const DB = c.env.DB
  const since = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const [posts, users, comments, pending, viewTotal, weekly, recentPosts, recentComments, topPosts] =
    await Promise.all([
      DB.prepare(
        `SELECT COUNT(*) AS total,
                SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) AS published,
                SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS drafts
         FROM posts`,
      ).first<{ total: number; published: number; drafts: number }>(),
      DB.prepare('SELECT COUNT(*) AS n FROM users').first<{ n: number }>(),
      DB.prepare('SELECT COUNT(*) AS n FROM comments').first<{ n: number }>(),
      DB.prepare("SELECT COUNT(*) AS n FROM comments WHERE status = 'pending'").first<{ n: number }>(),
      DB.prepare('SELECT COALESCE(SUM(views), 0) AS n FROM posts').first<{ n: number }>(),
      DB.prepare(
        `SELECT view_date AS date, SUM(views) AS views FROM post_views
         WHERE view_date >= ? GROUP BY view_date ORDER BY view_date ASC`,
      )
        .bind(since)
        .all<{ date: string; views: number }>(),
      DB.prepare(`${POST_LIST_SELECT} ORDER BY p.updated_at DESC LIMIT 5`).all<PostRow>(),
      DB.prepare(
        `SELECT c.id, c.content, c.parent_id, c.status, c.created_at,
                u.id AS user_id, u.username, u.avatar_url, u.bio, u.role,
                p.title AS post_title, p.slug AS post_slug
         FROM comments c
         JOIN users u ON u.id = c.user_id
         JOIN posts p ON p.id = c.post_id
         ORDER BY CASE c.status WHEN 'pending' THEN 0 ELSE 1 END, c.created_at DESC
         LIMIT 6`,
      ).all<CommentRow>(),
      DB.prepare(
        `SELECT id, title, slug, views FROM posts WHERE status = 'published'
         ORDER BY views DESC LIMIT 5`,
      ).all<{ id: string; title: string; slug: string; views: number }>(),
    ])

  const weeklyMap = new Map((weekly.results ?? []).map((row) => [row.date, Number(row.views)]))
  const weeklyViews = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10)
    return { date, views: weeklyMap.get(date) ?? 0 }
  })

  const data: AdminStats = {
    totals: {
      posts: Number(posts?.total) || 0,
      published: Number(posts?.published) || 0,
      drafts: Number(posts?.drafts) || 0,
      users: Number(users?.n) || 0,
      comments: Number(comments?.n) || 0,
      pendingComments: Number(pending?.n) || 0,
      views: Number(viewTotal?.n) || 0,
    },
    weeklyViews,
    recentPosts: (recentPosts.results ?? []).map(mapPost),
    recentComments: (recentComments.results ?? []).map(mapAdminComment),
    topPosts: (topPosts.results ?? []).map((row) => ({ ...row, views: Number(row.views) })),
  }
  return c.json(data)
})

app.get('/api/admin/posts', async (c) => {
  const DB = c.env.DB
  const { page, pageSize, offset } = pagination(c, 12)
  const q = (c.req.query('q') || '').trim().slice(0, 80)
  const status = c.req.query('status')
  const where: string[] = ['1 = 1']
  const binds: unknown[] = []
  if (q) {
    where.push('(p.title LIKE ? OR u.username LIKE ?)')
    binds.push(`%${q}%`, `%${q}%`)
  }
  if (status === 'published' || status === 'draft') {
    where.push('p.status = ?')
    binds.push(status)
  }
  const whereSql = where.join(' AND ')
  const [rows, count] = await Promise.all([
    DB.prepare(
      `${POST_LIST_SELECT} WHERE ${whereSql} ORDER BY p.updated_at DESC LIMIT ? OFFSET ?`,
    )
      .bind(...binds, pageSize, offset)
      .all<PostRow>(),
    DB.prepare(
      `SELECT COUNT(*) AS n FROM posts p JOIN users u ON u.id = p.author_id WHERE ${whereSql}`,
    )
      .bind(...binds)
      .first<{ n: number }>(),
  ])
  const total = Number(count?.n) || 0
  return c.json({
    items: (rows.results ?? []).map(mapPost),
    total,
    page,
    pageSize,
    hasMore: offset + (rows.results?.length ?? 0) < total,
  } satisfies Paginated<PostSummary>)
})

app.patch('/api/admin/posts/:id', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = adminPostSchema.safeParse(body)
  if (!parsed.success) return fail(c, '参数有误')
  const DB = c.env.DB
  const post = await DB.prepare('SELECT id, published_at FROM posts WHERE id = ?')
    .bind(c.req.param('id'))
    .first<{ id: string; published_at: string | null }>()
  if (!post) return fail(c, '文章不存在', 404)

  const statements = []
  if (parsed.data.featured === true) {
    statements.push(DB.prepare('UPDATE posts SET featured = 0 WHERE featured = 1'))
  }
  const updates: string[] = []
  const binds: unknown[] = []
  if (parsed.data.featured !== undefined) {
    updates.push('featured = ?')
    binds.push(parsed.data.featured ? 1 : 0)
  }
  if (parsed.data.status !== undefined) {
    updates.push('status = ?')
    binds.push(parsed.data.status)
    if (parsed.data.status === 'published' && !post.published_at) {
      updates.push('published_at = ?')
      binds.push(new Date().toISOString())
    }
  }
  if (updates.length) {
    updates.push('updated_at = ?')
    binds.push(new Date().toISOString())
    statements.push(
      DB.prepare(`UPDATE posts SET ${updates.join(', ')} WHERE id = ?`).bind(...binds, post.id),
    )
  }
  if (statements.length) await DB.batch(statements)
  const row = await DB.prepare(`${POST_LIST_SELECT} WHERE p.id = ?`).bind(post.id).first<PostRow>()
  return c.json(mapPost(row!))
})

app.delete('/api/admin/posts/:id', async (c) => {
  const DB = c.env.DB
  const post = await DB.prepare('SELECT id FROM posts WHERE id = ?')
    .bind(c.req.param('id'))
    .first<{ id: string }>()
  if (!post) return fail(c, '文章不存在', 404)
  await DB.batch([
    DB.prepare('DELETE FROM comments WHERE post_id = ?').bind(post.id),
    DB.prepare('DELETE FROM post_views WHERE post_id = ?').bind(post.id),
    DB.prepare('DELETE FROM posts WHERE id = ?').bind(post.id),
  ])
  return c.json({ ok: true })
})

app.get('/api/admin/comments', async (c) => {
  const DB = c.env.DB
  const { page, pageSize, offset } = pagination(c, 15)
  const status = c.req.query('status')
  const where: string[] = ['1 = 1']
  const binds: unknown[] = []
  if (status === 'approved' || status === 'pending' || status === 'rejected') {
    where.push('c.status = ?')
    binds.push(status)
  }
  const whereSql = where.join(' AND ')
  const [rows, count] = await Promise.all([
    DB.prepare(
      `SELECT c.id, c.content, c.parent_id, c.status, c.created_at,
              u.id AS user_id, u.username, u.avatar_url, u.bio, u.role,
              p.title AS post_title, p.slug AS post_slug
       FROM comments c
       JOIN users u ON u.id = c.user_id
       JOIN posts p ON p.id = c.post_id
       WHERE ${whereSql}
       ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
    )
      .bind(...binds, pageSize, offset)
      .all<CommentRow>(),
    DB.prepare(`SELECT COUNT(*) AS n FROM comments c WHERE ${whereSql}`)
      .bind(...binds)
      .first<{ n: number }>(),
  ])
  const total = Number(count?.n) || 0
  return c.json({
    items: (rows.results ?? []).map(mapAdminComment),
    total,
    page,
    pageSize,
    hasMore: offset + (rows.results?.length ?? 0) < total,
  } satisfies Paginated<AdminCommentRow>)
})

app.patch('/api/admin/comments/:id', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = adminCommentSchema.safeParse(body)
  if (!parsed.success) return fail(c, '参数有误')
  const result = await c.env.DB.prepare('UPDATE comments SET status = ? WHERE id = ?')
    .bind(parsed.data.status, c.req.param('id'))
    .run()
  if (!result.meta.changes) return fail(c, '评论不存在', 404)
  return c.json({ ok: true, status: parsed.data.status })
})

app.delete('/api/admin/comments/:id', async (c) => {
  const DB = c.env.DB
  const comment = await DB.prepare('SELECT id FROM comments WHERE id = ?')
    .bind(c.req.param('id'))
    .first<{ id: string }>()
  if (!comment) return fail(c, '评论不存在', 404)
  await DB.batch([
    DB.prepare('DELETE FROM comments WHERE parent_id = ?').bind(comment.id),
    DB.prepare('DELETE FROM comments WHERE id = ?').bind(comment.id),
  ])
  return c.json({ ok: true })
})

app.get('/api/admin/users', async (c) => {
  const DB = c.env.DB
  const { page, pageSize, offset } = pagination(c, 20)
  const q = (c.req.query('q') || '').trim().slice(0, 80)
  const where = q ? 'WHERE lower(u.username) LIKE lower(?) OR lower(u.email) LIKE lower(?)' : ''
  const binds = q ? [`%${q}%`, `%${q}%`] : []
  const [rows, count] = await Promise.all([
    DB.prepare(
      `SELECT u.id, u.username, u.email, u.role, u.status, u.bio, u.avatar_url, u.created_at,
              (SELECT COUNT(*) FROM posts p WHERE p.author_id = u.id) AS post_count,
              (SELECT COUNT(*) FROM comments c WHERE c.user_id = u.id) AS comment_count
       FROM users u ${where} ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
    )
      .bind(...binds, pageSize, offset)
      .all<{
        id: string
        username: string
        email: string
        role: Role
        status: 'active' | 'disabled'
        bio: string
        avatar_url: string | null
        created_at: string
        post_count: number
        comment_count: number
      }>(),
    DB.prepare(`SELECT COUNT(*) AS n FROM users u ${where}`)
      .bind(...binds)
      .first<{ n: number }>(),
  ])
  const total = Number(count?.n) || 0
  const items: AdminUser[] = (rows.results ?? []).map((row) => ({
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    status: row.status,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    postCount: Number(row.post_count) || 0,
    commentCount: Number(row.comment_count) || 0,
  }))
  return c.json({
    items,
    total,
    page,
    pageSize,
    hasMore: offset + (rows.results?.length ?? 0) < total,
  } satisfies Paginated<AdminUser>)
})

app.patch('/api/admin/users/:id', async (c) => {
  const me = c.get('user')!
  const id = c.req.param('id')
  if (id === me.id) return fail(c, '不能修改自己的角色或状态', 400)
  const body = await c.req.json().catch(() => null)
  const parsed = adminUserSchema.safeParse(body)
  if (!parsed.success) return fail(c, '参数有误')
  const DB = c.env.DB
  const target = await DB.prepare('SELECT id, role FROM users WHERE id = ?')
    .bind(id)
    .first<{ id: string; role: Role }>()
  if (!target) return fail(c, '用户不存在', 404)
  if (target.role === 'demo') return fail(c, '示例账号不可修改', 400)

  const updates: string[] = []
  const binds: unknown[] = []
  if (parsed.data.role !== undefined) {
    updates.push('role = ?')
    binds.push(parsed.data.role)
  }
  if (parsed.data.status !== undefined) {
    updates.push('status = ?')
    binds.push(parsed.data.status)
  }
  if (!updates.length) return fail(c, '没有需要更新的内容')
  updates.push('updated_at = ?')
  binds.push(new Date().toISOString())
  await DB.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`)
    .bind(...binds, id)
    .run()
  if (parsed.data.status === 'disabled') {
    await DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id).run()
  }
  return c.json({ ok: true })
})

app.get('/api/admin/settings', async (c) => {
  const settings = await readSettings(c.env.DB)
  return c.json(settings)
})

app.put('/api/admin/settings', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = settingsSchema.safeParse(body)
  if (!parsed.success) return fail(c, parsed.error.issues[0]?.message || '设置格式有误')
  const data = parsed.data
  const entries: [string, string][] = []
  if (data.siteName !== undefined) entries.push(['site_name', data.siteName])
  if (data.tagline !== undefined) entries.push(['tagline', data.tagline])
  if (data.description !== undefined) entries.push(['description', data.description])
  if (data.footerText !== undefined) entries.push(['footer_text', data.footerText])
  if (data.aboutBody !== undefined) entries.push(['about_body', data.aboutBody])
  if (data.commentsModeration !== undefined) {
    entries.push(['comments_moderation', data.commentsModeration ? 'true' : 'false'])
  }
  if (!entries.length) return fail(c, '没有需要保存的内容')
  await c.env.DB.batch(
    entries.map(([key, value]) =>
      c.env.DB.prepare(
        'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      ).bind(key, value),
    ),
  )
  const settings: SiteSettings = await readSettings(c.env.DB)
  return c.json(settings)
})

app.post('/api/admin/demo/remove', async (c) => {
  const DB = c.env.DB
  const count = await DB.prepare(
    "SELECT COUNT(*) AS n FROM posts WHERE author_id IN (SELECT id FROM users WHERE role = 'demo')",
  ).first<{ n: number }>()
  await DB.batch([
    DB.prepare(
      "DELETE FROM comments WHERE post_id IN (SELECT id FROM posts WHERE author_id IN (SELECT id FROM users WHERE role = 'demo'))",
    ),
    DB.prepare(
      "DELETE FROM post_views WHERE post_id IN (SELECT id FROM posts WHERE author_id IN (SELECT id FROM users WHERE role = 'demo'))",
    ),
    DB.prepare(
      "DELETE FROM posts WHERE author_id IN (SELECT id FROM users WHERE role = 'demo')",
    ),
    DB.prepare("DELETE FROM users WHERE role = 'demo'"),
  ])
  return c.json({ ok: true, removedPosts: Number(count?.n) || 0 })
})

export default app
