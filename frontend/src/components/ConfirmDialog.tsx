import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** Tom visual do botão de confirmação. */
  tone?: 'danger' | 'primary'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  // Bloqueia scroll de fundo e fecha com ESC enquanto o modal está aberto.
  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onCancel()
    }
    window.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open, loading, onCancel])

  if (!open) return null

  const confirmClasses =
    tone === 'danger'
      ? 'bg-rose-500 hover:bg-rose-600 text-white'
      : 'bg-pool-500 hover:bg-pool-600 text-white'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-navy-900/40 backdrop-blur-sm animate-fade-in"
      onClick={() => !loading && onCancel()}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-navy-100 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Fechar"
          onClick={onCancel}
          disabled={loading}
          className="absolute top-3 right-3 p-2 rounded-lg text-navy-700/50 hover:text-navy-900 hover:bg-navy-100 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <h2
          id="confirm-dialog-title"
          className="text-lg font-extrabold text-navy-900 pr-8"
        >
          {title}
        </h2>
        {description && (
          <div className="text-sm text-navy-700/70 mt-2 leading-relaxed">
            {description}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="btn-ghost"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold shadow-sm active:scale-[0.98] transition disabled:opacity-60 disabled:cursor-not-allowed ${confirmClasses}`}
          >
            {loading ? 'A processar…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
