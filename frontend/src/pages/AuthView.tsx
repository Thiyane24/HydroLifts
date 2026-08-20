import { FormEvent, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn, UserPlus, Waves } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

type Mode = 'login' | 'register'

interface FieldErrors {
  email?: string
  password?: string
}

function validate(email: string, password: string, mode: Mode): FieldErrors {
  const errors: FieldErrors = {}
  if (!email) errors.email = 'Email obrigatório.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Email inválido.'
  if (!password) errors.password = 'Palavra-passe obrigatória.'
  else if (password.length < 6) errors.password = 'Mínimo de 6 caracteres.'
  else if (mode === 'register' && password.length < 8)
    errors.password = 'Para registar usa pelo menos 8 caracteres.'
  return errors
}

export function AuthView() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const { login, register, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/dashboard'

  const errors = useMemo(() => validate(email, password, mode), [email, password, mode])
  const isValid = Object.keys(errors).length === 0

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    try {
      if (mode === 'login') await login(email, password)
      else await register(email, password)
      navigate(from, { replace: true })
    } catch {
      // feedback já dado pelo interceptor
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10 bg-gradient-to-b from-pool-50 via-navy-50 to-navy-50">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pool-400 to-pool-700 flex items-center justify-center shadow-pool">
            <Waves className="w-9 h-9 text-white" />
          </div>
          <h1 className="mt-4 text-3xl font-extrabold text-navy-900 tracking-tight">
            HydroLifts
          </h1>
          <p className="text-sm text-navy-700/70 mt-1 text-center max-w-xs">
            Rastreia treinos de ginásio e natação. Mergulha na consistência.
          </p>
        </div>

        <div className="card p-6 sm:p-8">
          {/* TABS */}
          <div className="flex p-1 bg-navy-100 rounded-full mb-6" role="tablist">
            {(['login', 'register'] as Mode[]).map((m) => {
              const active = mode === m
              return (
                <button
                  key={m}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setMode(m)}
                  className={`flex-1 tab-pill ${active ? 'bg-white text-pool-700 shadow-sm' : 'text-navy-700/70'}`}
                >
                  {m === 'login' ? 'Entrar' : 'Criar conta'}
                </button>
              )
            })}
          </div>

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            {/* EMAIL */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-navy-700 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="voce@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`input-base ${errors.email ? 'border-rose-400 focus:border-rose-500' : ''}`}
              />
              {errors.email && (
                <p className="text-xs text-rose-600 mt-1.5">{errors.email}</p>
              )}
            </div>

            {/* PASSWORD */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-navy-700 mb-1.5">
                Palavra-passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`input-base pr-12 ${errors.password ? 'border-rose-400 focus:border-rose-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-navy-700/60 hover:text-pool-600"
                  aria-label={showPwd ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-rose-600 mt-1.5">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={!isValid || loading}
              className="btn-primary w-full mt-2"
            >
              {mode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  {loading ? 'A entrar…' : 'Entrar'}
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  {loading ? 'A criar…' : 'Criar conta e começar'}
                </>
              )}
            </button>
          </form>

          {/* helper text */}
          <p className="text-xs text-center text-navy-700/60 mt-5">
            {mode === 'login' ? (
              <>
                Ainda não tens conta?{' '}
                <button
                  onClick={() => setMode('register')}
                  className="text-pool-700 font-semibold hover:underline"
                >
                  Cria aqui
                </button>
              </>
            ) : (
              <>
                Já tens conta?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="text-pool-700 font-semibold hover:underline"
                >
                  Entrar
                </button>
              </>
            )}
          </p>
        </div>

        <p className="text-center text-xs text-navy-700/40 mt-6">
          Feito com 💧 para a tua melhor versão.
        </p>
      </div>

      {/* hidden link fallback */}
      {!from && <Link to="/dashboard" className="hidden" />}
    </div>
  )
}
