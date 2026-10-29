export type Role = 'user' | 'admin' | 'demo'
export type PostStatus = 'draft' | 'published'
export type CommentStatus = 'approved' | 'pending' | 'rejected'

export interface Author {
  id: string
  username: string
  avatarUrl: string | null
  bio: string
  role: Role
}

export interface AuthUser extends Author {
  email: string
  createdAt: string
}

export interface PostSummary {
  id: string
  slug: string
  title: string
  excerpt: string
  coverUrl: string | null
  tags: string[]
  featured: boolean
  status: PostStatus
  views: number
  readingMinutes: number
  createdAt: string
  updatedAt: string
  publishedAt: string | null
  author: Author
  commentCount: number
}

export interface PostDetail extends PostSummary {
  content: string
}

export interface Comment {
  id: string
  content: string
  parentId: string | null
  status: CommentStatus
  createdAt: string
  user: Author
  replies?: Comment[]
}

export interface Paginated<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface SiteSettings {
  siteName: string
  tagline: string
  description: string
  footerText: string
  aboutBody: string
  commentsModeration: boolean
}

export interface TagCount {
  tag: string
  count: number
}

export interface HomeData {
  featured: PostSummary | null
  latest: PostSummary[]
  trending: PostSummary[]
  tags: TagCount[]
  stats: {
    posts: number
    writers: number
    comments: number
  }
  site: SiteSettings
}

export interface AuthorPageData {
  user: Author & { createdAt: string }
  posts: PostSummary[]
  stats: {
    posts: number
    views: number
  }
}

export interface AdminStats {
  totals: {
    posts: number
    published: number
    drafts: number
    users: number
    comments: number
    pendingComments: number
    views: number
  }
  weeklyViews: { date: string; views: number }[]
  recentPosts: PostSummary[]
  recentComments: AdminComment[]
  topPosts: { id: string; title: string; slug: string; views: number }[]
}

export interface AdminComment extends Comment {
  postTitle: string
  postSlug: string
}

export interface AdminCommentRow extends Comment {
  postTitle: string
  postSlug: string
}

export interface AdminUser {
  id: string
  username: string
  email: string
  role: Role
  status: 'active' | 'disabled'
  bio: string
  avatarUrl: string | null
  createdAt: string
  postCount: number
  commentCount: number
}

export interface ApiErrorBody {
  error: string
}
