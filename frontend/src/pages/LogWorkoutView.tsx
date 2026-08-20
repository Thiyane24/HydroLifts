import { useNavigate } from 'react-router-dom'
import { WorkoutForm } from '../components/WorkoutForm'

export function LogWorkoutView() {
  const navigate = useNavigate()
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

      <WorkoutForm
        showCancel={false}
        onSaved={() => navigate('/dashboard')}
      />
    </div>
  )
}
