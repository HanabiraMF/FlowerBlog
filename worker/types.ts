import type { D1Database, Fetcher, R2Bucket } from '@cloudflare/workers-types'
import type { AuthUser } from '../shared/types'

export interface Bindings {
  DB: D1Database
  IMAGES: R2Bucket
  ASSETS: Fetcher
}

export type AppEnv = {
  Bindings: Bindings
  Variables: {
    user: AuthUser | null
  }
}
