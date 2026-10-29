# FlowerBlog

> 在字里行间，种下一朵花。

FlowerBlog 是一个现代、安静、适合慢慢写的博客模板。它包含完整的注册登录、图文发布、评论互动和管理后台，并且可以部署在 **Cloudflare Workers 免费套餐**上。

![FlowerBlog 首页预览](docs/preview-home.jpg)

## 功能

- **账号系统**：注册、登录、退出、会话保持、修改资料、修改密码
- **图文写作**：Markdown 编辑器、实时预览、封面上传、正文插图、标签、摘要、草稿/发布
- **博客前台**：首页精选、最新文章、热门文章、标签筛选、搜索、作者主页、关于页面
- **评论互动**：登录后评论、回复、删除自己的评论、评论审核开关
- **创作台**：我的文章、数据概览、文章管理
- **管理后台**：站点数据、近 7 天阅读曲线、文章管理、评论审核、用户管理、站点设置
- **图片存储**：图片上传到 Cloudflare R2，通过 Worker 安全读取，长缓存
- **响应式设计**：桌面、平板和手机均可使用
- **SEO / 安全**：语义化页面、CSP、安全响应头、HttpOnly Cookie、PBKDF2 密码哈希

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | React 19、React Router、Vite、TypeScript、Marked、DOMPurify |
| 后端 | Hono、Cloudflare Workers |
| 数据库 | Cloudflare D1（SQLite） |
| 图片 | Cloudflare R2 |
| 样式 | 原生 CSS（Fraunces + Manrope，本地字体） |

运行时不需要额外服务器，所有内容都在 Cloudflare 上完成。图片不会经过第三方图床。

## 本地运行

需要 Node.js **20.19+** 和 npm。

```bash
npm install
npm run db:migrate:local
npm run dev
```

打开 `http://localhost:5173`。

- 前端开发服务器：`http://localhost:5173`（HMR）
- Worker API：`http://localhost:8787`（Vite 会把 `/api` 代理过去）
- 完整构建预览：`npm run build && npm run preview`，打开 `http://localhost:8787`

首次启动会应用两份迁移：数据库结构，以及一套可删除的示例内容。

### 第一个管理员

**第一个注册的账号会自动成为管理员。** 本地启动后请先注册，然后访问 `/admin`。

示例内容里的作者是 `demo` 角色，没有可用的登录密码，不会占用管理员名额。部署到线上后，也请先完成管理员注册，再公开站点地址，避免被陌生人抢先。

## 部署到 Cloudflare

### 1. 登录并创建资源

```bash
npx wrangler login

# 创建 D1 数据库
npx wrangler d1 create flowerblog-db

# 创建 R2 存储桶（需先在 Cloudflare 控制台启用 R2，免费额度内不收费）
npx wrangler r2 bucket create flowerblog-images
```

`wrangler d1 create` 会输出一个 `database_id`。把它填入 `wrangler.jsonc` 中的 `database_id`，替换掉占位值：

```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "flowerblog-db",
    "database_id": "在这里填入你的真实 ID",
    "migrations_dir": "migrations"
  }
]
```

如果你修改了 R2 存储桶名称，请同步修改 `r2_buckets[].bucket_name`。

### 2. 初始化线上数据库

```bash
npm run db:migrate:remote
```

迁移会创建表、默认站点设置，以及示例文章。示例内容可以在后台 `站点设置 → 示例内容` 一键移除。

### 3. 构建并部署

```bash
npm run deploy
```

部署成功后，Wrangler 会输出类似 `https://flowerblog.<your-subdomain>.workers.dev` 的地址。

### 4. 开始使用

1. 打开线上地址，注册第一个账号（自动成为管理员）
2. 进入 `/admin`
3. 在 **站点设置** 里修改站点名称、标语、简介和关于页面
4. 如果不需要示例文章，点击 **移除全部示例内容**
5. 开始写第一篇真正属于你的文章

## 常用命令

```bash
npm run dev                # 同时启动 API 和前端开发服务器
npm run build              # 构建前端到 dist/
npm run preview            # 用 Wrangler 在 8787 端口预览完整应用
npm run deploy             # 构建并部署到 Cloudflare
npm run check              # TypeScript 类型检查
npm run db:migrate:local   # 本地应用 D1 迁移
npm run db:migrate:remote  # 线上应用 D1 迁移
```

## 目录结构

```text
.
├─ migrations/            D1 数据库迁移（结构 + 示例内容）
├─ public/                静态资源、示例插画、favicon
├─ shared/                前后端共享 TypeScript 类型
├─ worker/
│  ├─ index.ts            Worker 入口、安全头、图片读取
│  ├─ routes.ts           所有 API 路由
│  ├─ auth.ts             密码哈希、会话、认证辅助
│  ├─ db.ts               数据序列化和站点设置
│  └─ types.ts            Worker 绑定类型
├─ src/
│  ├─ pages/              页面（前台、创作台、后台）
│  ├─ components/         通用组件
│  ├─ context/            登录态、站点设置、Toast
│  ├─ styles/             设计系统与响应式样式
│  └─ lib/                格式化、Markdown 渲染
├─ wrangler.jsonc         Cloudflare 配置
└─ vite.config.ts
```

## 自定义

### 站点文案

登录管理员账号后进入 `/admin/settings`，可以修改：

- 站点名称
- 一句话标语
- 站点简介
- 关于页面正文（Markdown）
- 页脚文字
- 评论是否需要审核

### 颜色和字体

设计变量都在 `src/styles/base.css` 的 `:root` 中：

```css
--paper: #f7f3ea;       /* 页面底色 */
--ink: #19372c;         /* 主文字 */
--forest: #173f32;      /* 主色 */
--terracotta: #d37d60;  /* 强调色 */
--display: 'Fraunces Variable', ...;
--sans: 'Manrope Variable', ...;
```

字体通过 `@fontsource-variable` 本地打包，不依赖 Google Fonts。

### 删除示例内容

后台 `站点设置 → 示例内容 → 移除全部示例内容`。它会删除所有 `demo` 角色的作者、他们的文章和评论，不会影响你自己的账号。

## 数据与备份

```bash
# 导出线上 D1 数据
npx wrangler d1 export flowerblog-db --remote --output backup.sql
```

R2 中的图片建议定期通过 Cloudflare 控制台或 S3 兼容 API 备份。删除文章时不会自动清理已经上传到 R2 的图片，以免误删被其他文章引用的文件；如需节省空间，可以手动清理不再使用的对象。

## 免费额度说明

本项目使用的 Cloudflare 服务均有免费套餐：

- **Workers**：免费请求额度足够个人博客使用
- **D1**：免费存储与读写额度
- **R2**：免费存储额度，且没有传统意义上的出口流量费

具体额度会调整，请以 Cloudflare 官方价格页为准：

- <https://developers.cloudflare.com/workers/platform/limits/>
- <https://developers.cloudflare.com/d1/platform/pricing/>
- <https://developers.cloudflare.com/r2/pricing/>

R2 需要在 Cloudflare 控制台启用。如果暂时不打算使用 R2，也可以移除封面/图片上传入口，或把 `worker/routes.ts` 中的上传接口替换为其他图床。

> **一个小提示**：Workers 免费套餐的单次请求 CPU 时间上限为 10ms。密码哈希只在登录和注册时执行，个人博客的低频使用通常没有问题；如果偶尔遇到 `1102` CPU 限制，可以把 `worker/auth.ts` 中的 `PBKDF2_ITERATIONS` 调低，或升级到 Workers Paid 套餐。

## 安全说明

- 密码使用 PBKDF2-SHA256（100,000 次迭代）+ 随机盐存储
- 会话 token 仅存放在 HttpOnly、SameSite=Lax Cookie 中，数据库中只保存哈希
- 所有 Markdown 在渲染前经过 DOMPurify 清洗
- 上传仅允许 JPG/PNG/WebP/GIF/AVIF，单张最大 5MB
- 评论有 10 秒的基础频率限制
- 生产环境建议再为登录接口接入 Cloudflare Turnstile 或 WAF 速率限制

当前模板未包含邮箱验证、忘记密码邮件和 OAuth 登录。如果需要这些能力，可以接入 Resend、Cloudflare Email Routing 或任意邮件服务扩展。

## License

MIT

## 致谢

设计、插画和代码都是为这个模板专门制作的。愿你也在这里，找到一点属于自己的安静。
