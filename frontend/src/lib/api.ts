import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import toast from 'react-hot-toast'

/**
 * Pool Palette base URL
 * - Em dev, o Vite faz proxy de /api -> http://localhost:8000 (sem CORS)
 * - Em prod, defina VITE_API_URL no painel da Vercel (ex.: https://api.hydrolifts.app)
 *
 * ATENÇÃO (hack temporário): enquanto o projeto não tiver VITE_API_URL
 * configurado na Vercel, usamos o backend Render como fallback hardcoded
 * para destravar o login. Substituir por import.meta.env.VITE_API_URL
 * assim que a env var estiver configurada na Vercel.
 */
const FALLBACK_API_URL = 'https://hydrolifts.onrender.com'
const baseURL =
  (import.meta.env.VITE_API_URL as string | undefined) || FALLBACK_API_URL

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// --- REQUEST: injeta o Bearer token automaticamente ---
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('@hydrolifts:token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// --- RESPONSE: feedback de erro + cleanup em 401 ---
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: string | unknown[] }>) => {
    const status = error.response?.status
    const detail = error.response?.data?.detail

    const message =
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail
              .map((d) => (typeof d === 'object' && d !== null && 'msg' in d
                ? String((d as { msg?: unknown }).msg ?? '')
                : ''))
              .filter(Boolean)
              .join(', ')
          : error.message

    if (status === 401) {
      // Token expirado/inválido — limpamos e deixamos o roteador redirecionar
      localStorage.removeItem('@hydrolifts:token')
      localStorage.removeItem('@hydrolifts:user')
      if (!window.location.pathname.startsWith('/login')) {
        toast.error('Sessão expirada. Faz login novamente.')
      }
    } else if (status && status >= 500) {
      toast.error('Erro no servidor. Tenta novamente em instantes.')
    } else if (message) {
      toast.error(message)
    }

    return Promise.reject(error)
  },
)

// --- HELPERS de domínio (DRY + tipagem forte) ---

export interface GymExercisePayload {
  exercise_name: string
  sets: number
  reps: number
}

export interface SwimSetPayload {
  distance_m: number
  reps: number
}

export interface WorkoutPayload {
  workout_date: string // YYYY-MM-DD
  workout_type: 'gym' | 'swim'
  exercicios_ginasio?: GymExercisePayload[]
  series_natacao?: SwimSetPayload[]
}

export interface WeeklySummary {
  total_workouts: number
  total_gym_sets: number
  total_gym_reps: number
  total_swim_m: number
  running_equivalent_km: number
}

export const authApi = {
  /**
   * Login via OAuth2PasswordRequestForm (form-data).
   * `email` é mapeado para `username` porque o backend espera esse campo.
   */
  async login(email: string, password: string) {
    const body = new URLSearchParams()
    body.append('username', email)
    body.append('password', password)
    const { data } = await api.post<{ access_token: string; token_type: string }>(
      '/auth/login',
      body,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    )
    return data
  },

  async register(email: string, password: string) {
    const { data } = await api.post('/auth/register', { email, password })
    return data
  },
}

export const workoutsApi = {
  create(payload: WorkoutPayload) {
    return api.post('/workouts', payload)
  },
  list() {
    return api.get('/workouts')
  },
  update(workoutId: number, payload: WorkoutPayload) {
    return api.put(`/workouts/${workoutId}`, payload)
  },
  delete(workoutId: number) {
    return api.delete(`/workouts/${workoutId}`)
  },
}

export const analyticsApi = {
  weeklySummary() {
    return api.get<WeeklySummary>('/analytics/weekly-summary')
  },
}
