import { FormEvent, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  Check,
  Dumbbell,
  Plus,
  Save,
  Trash2,
  Waves,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { GymExercisePayload, SwimSetPayload, WorkoutPayload, workoutsApi } from '../lib/api'

type WorkoutKind = 'gym' | 'swim'

interface GymRow {
  id: string
  exercise_name: string
  sets: number | ''
  reps: number | ''
}
interface SwimRow {
  id: string
  distance_m: number | ''
  reps: number | ''
}

const newGym = (): GymRow => ({ id: crypto.randomUUID(), exercise_name: '', sets: '', reps: '' })
const newSwim = (): SwimRow => ({ id: crypto.randomUUID(), distance_m: '', reps: '' })

function isGymValid(rows: GymRow[]): boolean {
  return rows.every(
    (r) =>
      r.exercise_name.trim().length > 1 &&
      Number(r.sets) > 0 &&
      Number(r.reps) > 0,
  )
}
function isSwimValid(rows: SwimRow[]): boolean {
  return rows.every((r) => Number(r.distance_m) > 0 && Number(r.reps) > 0)
}

export function LogWorkoutView() {
  const navigate = useNavigate()
  const today = new Date().toISOString().slice(0, 10)

  const [kind, setKind] = useState<WorkoutKind>('gym')
  const [date, setDate] = useState(today)
  const [gym, setGym] = useState<GymRow[]>([newGym()])
  const [swim, setSwim] = useState<SwimRow[]>([newSwim()])
  const [submitting, setSubmitting] = useState(false)

  const isValid = useMemo(() => {
    if (!date) return false
    if (kind === 'gym') return isGymValid(gym)
    return isSwimValid(swim)
  }, [kind, date, gym, swim])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    setSubmitting(true)
    try {
      const payload: WorkoutPayload =
        kind === 'gym'
          ? {
              workout_date: date,
              workout_type: 'gym',
              exercicios_ginasio: gym.map<GymExercisePayload>((r) => ({
                exercise_name: r.exercise_name.trim(),
                sets: Number(r.sets),
                reps: Number(r.reps),
              })),
            }
          : {
              workout_date: date,
              workout_type: 'swim',
              series_natacao: swim.map<SwimSetPayload>((r) => ({
                distance_m: Number(r.distance_m),
                reps: Number(r.reps),
              })),
            }
      await workoutsApi.create(payload)
      toast.success('Treino gravado! 💪')
      navigate('/dashboard')
    } catch {
      // feedback do interceptor
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <header>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
          Registar Treino
        </h1>
        <p className="text-sm text-navy-700/70 mt-1">
          Adiciona um ou mais exercícios/séries ao mesmo treino.
        </p>
      </header>

      {/* TOGGLE */}
      <div className="card p-2">
        <div className="flex p-1 bg-navy-100 rounded-2xl" role="tablist">
          {(
            [
              { k: 'gym' as const, label: 'Ginásio', icon: Dumbbell },
              { k: 'swim' as const, label: 'Natação', icon: Waves },
            ]
          ).map(({ k, label, icon: Icon }) => {
            const active = kind === k
            return (
              <button
                key={k}
                role="tab"
                aria-selected={active}
                onClick={() => setKind(k)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                  active
                    ? 'bg-white text-pool-700 shadow-sm'
                    : 'text-navy-700/70 hover:text-navy-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {/* DATA */}
        <div className="card p-5">
          <label
            htmlFor="workout-date"
            className="flex items-center gap-2 text-sm font-medium text-navy-700 mb-2"
          >
            <CalendarDays className="w-4 h-4 text-pool-600" />
            Data do treino
          </label>
          <input
            id="workout-date"
            type="date"
            value={date}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            className="input-base"
          />
        </div>

        {/* LISTA DINÂMICA */}
        {kind === 'gym' ? (
          <GymList rows={gym} setRows={setGym} />
        ) : (
          <SwimList rows={swim} setRows={setSwim} />
        )}

        {/* SUBMIT */}
        <button
          type="submit"
          disabled={!isValid || submitting}
          className="btn-primary w-full text-base"
        >
          {submitting ? (
            'A gravar…'
          ) : (
            <>
              <Save className="w-4 h-4" />
              Gravar Treino
            </>
          )}
        </button>
      </form>
    </div>
  )
}

// --- SUB-COMPONENTES ---

function GymList({
  rows,
  setRows,
}: {
  rows: GymRow[]
  setRows: React.Dispatch<React.SetStateAction<GymRow[]>>
}) {
  const update = (id: string, patch: Partial<GymRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  const remove = (id: string) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev))
  const add = () => setRows((prev) => [...prev, newGym()])

  return (
    <section className="space-y-3">
      {rows.map((r, idx) => {
        const rowValid =
          r.exercise_name.trim().length > 1 && Number(r.sets) > 0 && Number(r.reps) > 0
        return (
          <div
            key={r.id}
            className={`card p-5 space-y-3 transition ${
              rowValid ? 'border-mint-500/30' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-lg grid place-items-center text-xs font-bold ${
                    rowValid
                      ? 'bg-mint-500/15 text-mint-600'
                      : 'bg-pool-50 text-pool-700'
                  }`}
                >
                  {rowValid ? <Check className="w-4 h-4" /> : idx + 1}
                </div>
                <span className="text-sm font-semibold text-navy-900">
                  Exercício {idx + 1}
                </span>
              </div>
              <button
                type="button"
                onClick={() => remove(r.id)}
                disabled={rows.length === 1}
                className="p-2 text-navy-700/40 hover:text-rose-500 disabled:opacity-30 disabled:hover:text-navy-700/40"
                aria-label="Remover exercício"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-medium text-navy-700/80 mb-1 block">
                Nome do exercício
              </label>
              <input
                type="text"
                placeholder="Ex.: Agachamento"
                value={r.exercise_name}
                onChange={(e) => update(r.id, { exercise_name: e.target.value })}
                className="input-base"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-navy-700/80 mb-1 block">
                  Séries
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  placeholder="3"
                  value={r.sets}
                  onChange={(e) =>
                    update(r.id, { sets: e.target.value === '' ? '' : Number(e.target.value) })
                  }
                  className="input-base"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-navy-700/80 mb-1 block">
                  Reps
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  placeholder="10"
                  value={r.reps}
                  onChange={(e) =>
                    update(r.id, { reps: e.target.value === '' ? '' : Number(e.target.value) })
                  }
                  className="input-base"
                />
              </div>
            </div>
          </div>
        )
      })}

      <button
        type="button"
        onClick={add}
        className="w-full py-3 rounded-2xl border-2 border-dashed border-pool-300 text-pool-700 font-semibold text-sm hover:bg-pool-50 transition flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Adicionar exercício
      </button>
    </section>
  )
}

function SwimList({
  rows,
  setRows,
}: {
  rows: SwimRow[]
  setRows: React.Dispatch<React.SetStateAction<SwimRow[]>>
}) {
  const update = (id: string, patch: Partial<SwimRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  const remove = (id: string) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev))
  const add = () => setRows((prev) => [...prev, newSwim()])

  return (
    <section className="space-y-3">
      {rows.map((r, idx) => {
        const rowValid = Number(r.distance_m) > 0 && Number(r.reps) > 0
        return (
          <div
            key={r.id}
            className={`card p-5 space-y-3 transition ${rowValid ? 'border-mint-500/30' : ''}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-lg grid place-items-center text-xs font-bold ${
                    rowValid ? 'bg-mint-500/15 text-mint-600' : 'bg-pool-50 text-pool-700'
                  }`}
                >
                  {rowValid ? <Check className="w-4 h-4" /> : idx + 1}
                </div>
                <span className="text-sm font-semibold text-navy-900">Série {idx + 1}</span>
              </div>
              <button
                type="button"
                onClick={() => remove(r.id)}
                disabled={rows.length === 1}
                className="p-2 text-navy-700/40 hover:text-rose-500 disabled:opacity-30 disabled:hover:text-navy-700/40"
                aria-label="Remover série"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-navy-700/80 mb-1 block">
                  Distância (m)
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  placeholder="200"
                  value={r.distance_m}
                  onChange={(e) =>
                    update(r.id, {
                      distance_m: e.target.value === '' ? '' : Number(e.target.value),
                    })
                  }
                  className="input-base"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-navy-700/80 mb-1 block">
                  Repetições
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  placeholder="4"
                  value={r.reps}
                  onChange={(e) =>
                    update(r.id, {
                      reps: e.target.value === '' ? '' : Number(e.target.value),
                    })
                  }
                  className="input-base"
                />
              </div>
            </div>
          </div>
        )
      })}

      <button
        type="button"
        onClick={add}
        className="w-full py-3 rounded-2xl border-2 border-dashed border-pool-300 text-pool-700 font-semibold text-sm hover:bg-pool-50 transition flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Adicionar série
      </button>
    </section>
  )
}
