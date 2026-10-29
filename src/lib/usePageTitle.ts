import { useEffect } from 'react'
import { useSite } from '../context/SiteContext'

export function usePageTitle(title?: string) {
  const { site } = useSite()
  useEffect(() => {
    document.title = title ? `${title} · ${site.siteName}` : `${site.siteName} · ${site.tagline}`
  }, [title, site.siteName, site.tagline])
}
