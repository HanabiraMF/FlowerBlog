import { Hono } from 'hono'
import api from './routes'
import { loadSessionUser } from './auth'
import type { AppEnv } from './types'

const app = new Hono<AppEnv>()

app.use('*', async (c, next) => {
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('X-Frame-Options', 'DENY')
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
  c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  c.header(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  )
  await next()
})

app.use('/api/*', async (c, next) => {
  c.set('user', null)
  if (c.req.path.startsWith('/api/images/')) {
    await next()
    return
  }
  c.set('user', await loadSessionUser(c))
  await next()
})

app.get('/api/health', (c) => c.json({ ok: true, name: 'FlowerBlog' }))

app.get('/api/images/*', async (c) => {
  const key = c.req.path.replace('/api/images/', '')
  if (!key || key.includes('..')) return c.json({ error: '图片不存在' }, 404)
  const object = await c.env.IMAGES.get(key)
  if (!object) return c.json({ error: '图片不存在' }, 404)

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('ETag', object.httpEtag)
  headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  headers.set('X-Content-Type-Options', 'nosniff')
  if (c.req.header('If-None-Match') === object.httpEtag) {
    return new Response(null, { status: 304, headers })
  }
  return new Response(object.body as unknown as BodyInit, { headers })
})

app.route('/', api)

app.notFound((c) => {
  if (c.req.path.startsWith('/api/')) return c.json({ error: '接口不存在' }, 404)
  return c.env.ASSETS.fetch(c.req.raw)
})

app.onError((error, c) => {
  console.error(error)
  if (c.req.path.startsWith('/api/')) {
    return c.json({ error: '服务器开小差了，请稍后重试' }, 500)
  }
  return c.text('Something went wrong.', 500)
})

export default app
