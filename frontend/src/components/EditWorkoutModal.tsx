import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'
import { WorkoutForm, WorkoutSeed } from './WorkoutForm'

export interface EditWorkoutModalProps {
  workout: WorkoutSeed | null
  onCancel: () => void
  onSaved: (updated: WorkoutSeed) => void
}

export function EditWorkoutModal({
  workout,
  onCancel,
  onSaved,
}: EditWorkoutModalProps): ReactNode {
  const open = Boolean(workout)

  // Bloqueia scroll de fundo e fecha com ESC enquanto o modal está aberto.
  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onCancel])

  if (!workout) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-workout-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-navy-900/40 backdrop-blur-sm animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-2xl shadow-xl border border-navy-100 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Fechar"
          onClick={onCancel}
          className="absolute top-3 right-3 p-2 rounded-lg text-navy-700/50 hover:text-navy-900 hover:bg-navy-100 transition z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-8 space-y-5">
          <header>
            <h2
              id="edit-workout-title"
              className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight pr-8"
            >
              Editar Treino
            </h2>
            <p className="text-sm text-navy-700/70 mt-1">
              Ajusta a data, tipo ou os exercícios/séries deste treino.
            </p>
          </header>

          <WorkoutForm
            initial={workout}
            onSaved={onSaved}
            onCancel={onCancel}
            showCancel
          />
        </div>
      </div>
    </div>
  )
}
