import { FormEvent, useEffect, useMemo, useState } from 'react'
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
import {
  GymExercisePayload,
  GymSetDetailPayload,
  SwimSetPayload,
  WeightUnit,
  WorkoutPayload,
  workoutsApi,
} from '../lib/api'

export type WorkoutKind = 'gym' | 'swim'

export interface GymSetRow {
  id: string
  set_index: number
  reps: number | ''
  weight_value: number | ''
  weight_unit: WeightUnit
}

export interface GymRow {
  id: string
  exercise_name: string
  sets: number | ''
  reps: number | ''
  weight_value: number | ''
  weight_unit: WeightUnit
  series_detalhadas: GymSetRow[]
}
export interface SwimRow {
  id: string
  distance_m: number | ''
  reps: number | ''
}

/** Forma "crua" devolvida pela API (sem ids aninhados tipados). */
export interface WorkoutSeed {
  workout_id: number
  workout_date: string
  workout_type: string
  exercicios_ginasio?: {
    exercise_name: string
    sets: number
    reps: number
    weight_value?: number | null
    weight_unit?: WeightUnit | null
    series_detalhadas?: {
      set_index: number
      reps?: number | null
      weight_value?: number | null
      weight_unit?: WeightUnit | null
    }[]
  }[]
  series_natacao?: { distance_m: number; reps: number }[]
}

export interface WorkoutFormProps {
  /** Quando definido, o formulário entra em modo de edição e submete via PUT. */
  initial?: WorkoutSeed
  /** Callback após gravar (criar ou editar) com sucesso. */
  onSaved?: (workout: WorkoutSeed) => void
  /** Callback ao cancelar (no contexto de modal). */
  onCancel?: () => void
  /** Esconde o botão "Cancelar" (usado em página cheia). */
  showCancel?: boolean
}

const newGym = (): GymRow => ({
  id: crypto.randomUUID(),
  exercise_name: '',
  sets: '',
  reps: '',
  weight_value: '',
  weight_unit: 'kg',
  series_detalhadas: [],
})
const newSwim = (): SwimRow => ({
  id: crypto.randomUUID(),
  distance_m: '',
  reps: '',
})

/** Validação: peso e unidade têm de aparecer juntos (ou nenhum). */
function isGymWeightConsistent(r: GymRow): boolean {
  const hasValue = r.weight_value !== '' && Number(r.weight_value) > 0
  return hasValue ? Boolean(r.weight_unit) : true
}

function isGymValid(rows: GymRow[]): boolean {
  return rows.every(
    (r) =>
      r.exercise_name.trim().length > 1 &&
      Number(r.sets) > 0 &&
      Number(r.reps) > 0 &&
      isGymWeightConsistent(r),
  )
}
function isSwimValid(rows: SwimRow[]): boolean {
  return rows.every((r) => Number(r.distance_m) > 0 && Number(r.reps) > 0)
}

function seedFromInitial(initial: WorkoutSeed | undefined): {
  kind: WorkoutKind
  date: string
  gym: GymRow[]
  swim: SwimRow[]
} {
  if (!initial) {
    const today = new Date().toISOString().slice(0, 10)
    return { kind: 'gym', date: today, gym: [newGym()], swim: [newSwim()] }
  }

  const kind: WorkoutKind = initial.workout_type === 'swim' ? 'swim' : 'gym'
  const date =
    typeof initial.workout_date === 'string'
      ? initial.workout_date
      : new Date(initial.workout_date).toISOString().slice(0, 10)

  const gym: GymRow[] =
    initial.exercicios_ginasio && initial.exercicios_ginasio.length > 0
      ? initial.exercicios_ginasio.map((e) => ({
          id: crypto.randomUUID(),
          exercise_name: e.exercise_name,
          sets: e.sets,
          reps: e.reps,
          weight_value: e.weight_value ?? '',
          weight_unit: e.weight_unit ?? 'kg',
          series_detalhadas: (e.series_detalhadas ?? []).map((s) => ({
            id: crypto.randomUUID(),
            set_index: s.set_index,
            reps: s.reps ?? '',
            weight_value: s.weight_value ?? '',
            weight_unit: s.weight_unit ?? 'kg',
          })),
        }))
      : [newGym()]

  const swim: SwimRow[] =
    initial.series_natacao && initial.series_natacao.length > 0
      ? initial.series_natacao.map((s) => ({
          id: crypto.randomUUID(),
          distance_m: s.distance_m,
          reps: s.reps,
        }))
      : [newSwim()]

  return { kind, date, gym, swim }
}

export function WorkoutForm({
  initial,
  onSaved,
  onCancel,
  showCancel = true,
}: WorkoutFormProps) {
  const today = new Date().toISOString().slice(0, 10)
  const seeded = useMemo(() => seedFromInitial(initial), [initial])

  const [kind, setKind] = useState<WorkoutKind>(seeded.kind)
  const [date, setDate] = useState(seeded.date)
  const [gym, setGym] = useState<GymRow[]>(seeded.gym)
  const [swim, setSwim] = useState<SwimRow[]>(seeded.swim)
  const [submitting, setSubmitting] = useState(false)

  // Reinicia estado sempre que o `initial` muda (ex.: abrir modal para outro treino).
  useEffect(() => {
    const s = seedFromInitial(initial)
    setKind(s.kind)
    setDate(s.date)
    setGym(s.gym)
    setSwim(s.swim)
  }, [initial])

  const isEditing = Boolean(initial)
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
              exercicios_ginasio: gym.map<GymExercisePayload>((r) => {
                const base: GymExercisePayload = {
                  exercise_name: r.exercise_name.trim(),
                  sets: Number(r.sets),
                  reps: Number(r.reps),
                }
                if (r.weight_value !== '' && Number(r.weight_value) > 0) {
                  base.weight_value = Number(r.weight_value)
                  base.weight_unit = r.weight_unit
                }
                if (r.series_detalhadas.length > 0) {
                  base.series_detalhadas = r.series_detalhadas
                    .filter((s) => s.reps !== '' || s.weight_value !== '')
                    .map((s) => {
                      const det: GymSetDetailPayload = {
                        set_index: s.set_index,
                      }
                      if (s.reps !== '') det.reps = Number(s.reps)
                      if (s.weight_value !== '' && Number(s.weight_value) > 0) {
                        det.weight_value = Number(s.weight_value)
                        det.weight_unit = s.weight_unit
                      }
                      return det
                    })
                }
                return base
              }),
            }
          : {
              workout_date: date,
              workout_type: 'swim',
              series_natacao: swim.map<SwimSetPayload>((r) => ({
                distance_m: Number(r.distance_m),
                reps: Number(r.reps),
              })),
            }

      if (isEditing && initial) {
        const { data } = await workoutsApi.update(initial.workout_id, payload)
        toast.success('Treino atualizado com sucesso!')
        onSaved?.({ ...initial, ...data })
      } else {
        const { data } = await workoutsApi.create(payload)
        toast.success('Treino gravado! 💪')
        onSaved?.(data as WorkoutSeed)
      }
    } catch {
      // feedback do interceptor
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
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
                type="button"
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

      {/* AÇÕES */}
      <div className={showCancel ? 'flex gap-3' : ''}>
        <button
          type="submit"
          disabled={!isValid || submitting}
          className={`btn-primary text-base ${showCancel ? 'flex-1' : 'w-full'}`}
        >
          {submitting ? (
            'A gravar…'
          ) : (
            <>
              <Save className="w-4 h-4" />
              {isEditing ? 'Atualizar Treino' : 'Gravar Treino'}
            </>
          )}
        </button>
        {showCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="btn-ghost text-base"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}

// --- SUB-COMPONENTES (idênticos à versão anterior, isolados para reuso) ---

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

  const updateSet = (rowId: string, setId: string, patch: Partial<GymSetRow>) =>
    setRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? {
              ...r,
              series_detalhadas: r.series_detalhadas.map((s) =>
                s.id === setId ? { ...s, ...patch } : s,
              ),
            }
          : r,
      ),
    )
  const addSet = (rowId: string) =>
    setRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? {
              ...r,
              series_detalhadas: [
                ...r.series_detalhadas,
                {
                  id: crypto.randomUUID(),
                  set_index: r.series_detalhadas.length + 1,
                  reps: '',
                  weight_value: '',
                  weight_unit: r.weight_unit,
                },
              ],
            }
          : r,
      ),
    )
  const removeSet = (rowId: string, setId: string) =>
    setRows((prev) =>
      prev.map((r) =>
        r.id === rowId
          ? {
              ...r,
              series_detalhadas: r.series_detalhadas
                .filter((s) => s.id !== setId)
                .map((s, i) => ({ ...s, set_index: i + 1 })),
            }
          : r,
      ),
    )

  return (
    <section className="space-y-3">
      {rows.map((r, idx) => {
        const rowValid =
          r.exercise_name.trim().length > 1 &&
          Number(r.sets) > 0 &&
          Number(r.reps) > 0 &&
          isGymWeightConsistent(r)
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

            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
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

            {/* PESO (OPCIONAL) */}
            <div className="grid grid-cols-1 xs:grid-cols-[1fr_auto] gap-3 items-end">
              <div>
                <label className="text-xs font-medium text-navy-700/80 mb-1 block">
                  Peso <span className="text-navy-700/40">(opcional)</span>
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  min={0}
                  placeholder="—"
                  value={r.weight_value}
                  onChange={(e) =>
                    update(r.id, {
                      weight_value: e.target.value === '' ? '' : Number(e.target.value),
                    })
                  }
                  className="input-base"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-navy-700/80 mb-1 block">
                  Unidade
                </label>
                <select
                  value={r.weight_unit}
                  onChange={(e) =>
                    update(r.id, { weight_unit: e.target.value as WeightUnit })
                  }
                  className="input-base min-w-[80px]"
                  aria-label="Unidade de peso"
                >
                  <option value="kg">kg</option>
                  <option value="lb">lb</option>
                </select>
              </div>
            </div>

            {/* SÉRIES DETALHADAS (OPCIONAL) */}
            {r.series_detalhadas.length > 0 && (
              <div className="mt-2 space-y-2 pl-2 xs:pl-3 border-l-2 border-pool-200">
                <p className="text-xs font-semibold text-navy-700/80">
                  Séries individuais
                </p>
                {r.series_detalhadas.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-col gap-2 p-2 rounded-lg bg-navy-50/50 xs:grid xs:grid-cols-[auto_1fr_1fr_auto] xs:items-center xs:gap-2 xs:bg-transparent xs:p-0"
                  >
                    <div className="flex items-center justify-between xs:justify-start">
                      <span className="text-xs font-bold text-navy-700/60 w-8">
                        #{s.set_index}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeSet(r.id, s.id)}
                        className="xs:hidden p-2 min-w-[36px] min-h-[36px] grid place-items-center text-navy-700/40 hover:text-rose-500"
                        aria-label={`Remover série ${s.set_index}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      placeholder="reps"
                      value={s.reps}
                      onChange={(e) =>
                        updateSet(r.id, s.id, {
                          reps: e.target.value === '' ? '' : Number(e.target.value),
                        })
                      }
                      className="input-base text-sm py-2"
                      aria-label={`Reps da série ${s.set_index}`}
                    />
                    <div className="flex gap-1 min-w-0">
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.5"
                        min={0}
                        placeholder="peso"
                        value={s.weight_value}
                        onChange={(e) =>
                          updateSet(r.id, s.id, {
                            weight_value:
                              e.target.value === '' ? '' : Number(e.target.value),
                          })
                        }
                        className="input-base text-sm py-2 flex-1 min-w-0"
                        aria-label={`Peso da série ${s.set_index}`}
                      />
                      <select
                        value={s.weight_unit}
                        onChange={(e) =>
                          updateSet(r.id, s.id, {
                            weight_unit: e.target.value as WeightUnit,
                          })
                        }
                        className="input-base text-sm py-2 px-2 shrink-0"
                        aria-label={`Unidade da série ${s.set_index}`}
                      >
                        <option value="kg">kg</option>
                        <option value="lb">lb</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSet(r.id, s.id)}
                      className="hidden xs:grid xs:place-items-center p-2 min-w-[36px] min-h-[36px] text-navy-700/40 hover:text-rose-500"
                      aria-label={`Remover série ${s.set_index}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => addSet(r.id)}
              className="w-full text-xs py-2 rounded-xl border border-dashed border-navy-200 text-navy-700/60 hover:bg-navy-50 transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              {r.series_detalhadas.length === 0
                ? 'Adicionar séries detalhadas (peso por série)'
                : 'Adicionar outra série'}
            </button>
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

            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
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
