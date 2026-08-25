import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LogOut, Waves, Dumbbell, LayoutDashboard, PlusCircle, BarChart3 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const navItems = [
    { to: '/dashboard', label: 'Resumo', icon: LayoutDashboard },
    { to: '/monthly', label: 'Mês', icon: BarChart3 },
    { to: '/log', label: 'Registar', icon: PlusCircle },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-navy-50">
      {/* NAVBAR SUPERIOR */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/80 border-b border-navy-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link to="/dashboard" className="flex items-center gap-2 group min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pool-400 to-pool-700 flex items-center justify-center shadow-pool shrink-0">
              <Waves className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight min-w-0 hidden sm:block">
              <p className="font-extrabold text-navy-900 tracking-tight truncate">HydroLifts</p>
              <p className="text-[10px] uppercase tracking-widest text-pool-700 font-semibold">
                Gym · Swim
              </p>
            </div>
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-pool-50 text-pool-700'
                      : 'text-navy-700 hover:bg-navy-100'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex flex-col items-end leading-tight min-w-0">
              <span className="text-xs text-navy-700/70">Conectado como</span>
              <span className="text-sm font-semibold text-navy-900 truncate max-w-[160px]">
                {user?.email}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="btn-ghost !px-3 min-h-[44px]"
              aria-label="Terminar sessão"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* CONTEÚDO */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 pb-tabbar animate-fade-in">
        <Outlet />
      </main>

      {/* TAB BAR MOBILE (bottom) — respeita safe-area do iOS */}
      <nav
        className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-navy-100"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="grid grid-cols-3">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 min-h-[56px] py-2 text-[11px] font-medium transition ${
                  isActive ? 'text-pool-600' : 'text-navy-700/70'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Dica sutil de boas-vindas quando o user entra pela 1ª vez */}
      {user && (
        <Dumbbell
          className="hidden"
          aria-hidden
          onLoad={() => toast.dismiss()}
        />
      )}
    </div>
  )
}
