import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api, errorMessage } from '../api'
import type { AuthUser } from '../../shared/types'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (identifier: string, password: string) => Promise<AuthUser>
  register: (
    username: string,
    email: string,
    password: string,
  ) => Promise<{ user: AuthUser; isFirstAdmin: boolean }>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  setUser: (user: AuthUser | null) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<{ user: AuthUser | null }>('/api/auth/me')
      setUser(data.user)
    } catch (error) {
      console.error(errorMessage(error))
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const login = useCallback(async (identifier: string, password: string) => {
    const data = await api.post<{ user: AuthUser }>('/api/auth/login', {
      identifier,
      password,
    })
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (username: string, email: string, password: string) => {
    const data = await api.post<{ user: AuthUser; isFirstAdmin?: boolean }>(
      '/api/auth/register',
      { username, email, password },
    )
    setUser(data.user)
    return { user: data.user, isFirstAdmin: Boolean(data.isFirstAdmin) }
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout')
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh, setUser }),
    [user, loading, login, register, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
