import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import toast from 'react-hot-toast'
import { authApi } from '../lib/api'

interface User {
  email: string
}

interface AuthContextValue {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const TOKEN_KEY = '@hydrolifts:token'
const USER_KEY = '@hydrolifts:user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  })
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [loading, setLoading] = useState(false)

  const persist = useCallback((nextToken: string | null, nextUser: User | null) => {
    if (nextToken) localStorage.setItem(TOKEN_KEY, nextToken)
    else localStorage.removeItem(TOKEN_KEY)
    if (nextUser) localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
    else localStorage.removeItem(USER_KEY)
    setToken(nextToken)
    setUser(nextUser)
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true)
      try {
        const { access_token } = await authApi.login(email, password)
        persist(access_token, { email })
        toast.success('Bem-vindo de volta!')
      } catch {
        // O interceptor já exibe o toast — apenas evitamos ruído duplicado
        throw new Error('Falha no login')
      } finally {
        setLoading(false)
      }
    },
    [persist],
  )

  const register = useCallback(
    async (email: string, password: string) => {
      setLoading(true)
      try {
        await authApi.register(email, password)
        // Auto-login após registo para reduzir passos (Hick's Law)
        const { access_token } = await authApi.login(email, password)
        persist(access_token, { email })
        toast.success('Conta criada. Bons treinos!')
      } catch {
        throw new Error('Falha no registo')
      } finally {
        setLoading(false)
      }
    },
    [persist],
  )

  const logout = useCallback(() => {
    persist(null, null)
    toast('Sessão terminada', { icon: '👋' })
  }, [persist])

  // Limpa storage se outra aba fizer logout (sincronização simples)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY && !e.newValue) {
        setToken(null)
        setUser(null)
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      loading,
      login,
      register,
      logout,
    }),
    [user, token, loading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}
