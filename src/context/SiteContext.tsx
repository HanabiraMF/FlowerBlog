import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api } from '../api'
import type { SiteSettings } from '../../shared/types'

const defaultSite: SiteSettings = {
  siteName: 'FlowerBlog',
  tagline: '在字里行间，种下一朵花。',
  description: '一个关于生活、灵感与生长的文字花园。',
  footerText: '在喧嚣的世界里，留一块安静的地方，让文字慢慢发芽。',
  aboutBody: '',
  commentsModeration: false,
}

interface SiteContextValue {
  site: SiteSettings
  loading: boolean
  refreshSite: () => Promise<void>
  setSite: (site: SiteSettings) => void
}

const SiteContext = createContext<SiteContextValue | null>(null)

export function SiteProvider({ children }: { children: ReactNode }) {
  const [site, setSite] = useState<SiteSettings>(defaultSite)
  const [loading, setLoading] = useState(true)

  const refreshSite = useCallback(async () => {
    try {
      const data = await api.get<SiteSettings>('/api/site')
      setSite({ ...defaultSite, ...data })
    } catch {
      // The defaults keep the shell usable if the API is briefly unavailable.
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshSite()
  }, [refreshSite])

  useEffect(() => {
    document.title = `${site.siteName} · ${site.tagline}`
  }, [site.siteName, site.tagline])

  const value = useMemo(
    () => ({ site, loading, refreshSite, setSite }),
    [site, loading, refreshSite],
  )
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}

export function useSite() {
  const context = useContext(SiteContext)
  if (!context) throw new Error('useSite must be used inside SiteProvider')
  return context
}
