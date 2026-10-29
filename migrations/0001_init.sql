-- FlowerBlog schema
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'demo')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  bio TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_nocase ON users (lower(username));
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_nocase ON users (lower(email));

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL,
  cover_url TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  featured INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  published_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_posts_status_published ON posts(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_featured ON posts(featured, status);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('approved', 'pending', 'rejected')),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_comments_post_status ON comments(post_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);

CREATE TABLE IF NOT EXISTS post_views (
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  view_date TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (post_id, view_date)
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT OR IGNORE INTO settings (key, value) VALUES
  ('site_name', 'FlowerBlog'),
  ('tagline', '在字里行间，种下一朵花。'),
  ('description', '一个关于生活、灵感与生长的文字花园。记录那些缓慢而确定的时刻，也收藏每一次不期而遇的心动。'),
  ('footer_text', '在喧嚣的世界里，留一块安静的地方，让文字慢慢发芽。'),
  ('about_body', '## 这是一座怎样的花园？

FlowerBlog 是一个为写作者准备的小小花园。我们相信，好的文字不必喧哗，它更像一粒种子，在合适的时候，安静地长出枝叶。

这里收藏关于**日常、自然、阅读与成长**的片段。你可以读一篇短文，留下一句回应，或者注册一个账号，在这里种下属于自己的第一朵花。

## 花园里的规则

- 真诚地表达，也温柔地倾听
- 尊重每一份原创，转载前请先获得许可
- 不发布广告、攻击性或违法内容
- 慢慢写，不着急

## 关于这个模板

FlowerBlog 使用 **Cloudflare Workers + D1 + R2** 构建，可以免费部署在 Cloudflare 的免费套餐内。它包含注册登录、图文发布、评论互动和一套简洁的创作后台。

希望你也在这里，找到一点属于自己的安静。'),
  ('comments_moderation', 'false');
