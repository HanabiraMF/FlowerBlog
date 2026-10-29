import type { Context } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import type { AppEnv } from './types'
import type { AuthUser } from '../shared/types'

export const SESSION_COOKIE = 'flower_session'
const SESSION_DAYS = 30
const PBKDF2_ITERATIONS = 100_000
const encoder = new TextEncoder()

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length)
  crypto.getRandomValues(bytes)
  return bytes
}

export function randomId(prefix = ''): string {
  return prefix + crypto.randomUUID().replaceAll('-', '')
}

export function randomToken(): string {
  return toBase64(randomBytes(32))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '')
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function hashPassword(
  password: string,
  salt?: string,
): Promise<{ hash: string; salt: string }> {
  const saltBytes = salt ? fromBase64(salt) : randomBytes(16)
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: saltBytes as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
    },
    key,
    256,
  )
  return { hash: toBase64(new Uint8Array(bits)), salt: toBase64(saltBytes) }
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i += 1) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return mismatch === 0
}

export async function verifyPassword(
  password: string,
  salt: string,
  expectedHash: string,
): Promise<boolean> {
  try {
    const { hash } = await hashPassword(password, salt)
    return safeEqual(hash, expectedHash)
  } catch {
    return false
  }
}

export async function createSession(c: Context<AppEnv>, userId: string): Promise<void> {
  const token = randomToken()
  const sessionId = await sha256(token)
  const now = new Date()
  const expires = new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(now.toISOString()),
    c.env.DB.prepare(
      'INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)',
    ).bind(sessionId, userId, expires.toISOString(), now.toISOString()),
  ])

  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    path: '/',
    sameSite: 'Lax',
    secure: new URL(c.req.url).protocol === 'https:',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  })
}

export async function clearSession(c: Context<AppEnv>): Promise<void> {
  const token = getCookie(c, SESSION_COOKIE)
  if (token) {
    const sessionId = await sha256(token)
    await c.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run()
  }
  deleteCookie(c, SESSION_COOKIE, { path: '/' })
}

interface SessionUserRow {
  id: string
  username: string
  email: string
  role: 'user' | 'admin' | 'demo'
  bio: string
  avatar_url: string | null
  created_at: string
}

export async function loadSessionUser(c: Context<AppEnv>): Promise<AuthUser | null> {
  const token = getCookie(c, SESSION_COOKIE)
  if (!token) return null
  const sessionId = await sha256(token)
  const row = await c.env.DB.prepare(
    `SELECT u.id, u.username, u.email, u.role, u.bio, u.avatar_url, u.created_at
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.id = ? AND s.expires_at > ? AND u.status = 'active'`,
  )
    .bind(sessionId, new Date().toISOString())
    .first<SessionUserRow>()

  if (!row) return null
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    role: row.role,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
  }
}
