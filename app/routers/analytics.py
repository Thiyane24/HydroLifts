from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

import models
import schemas
import security
from database import get_db

router = APIRouter()


@router.get("/analytics/weekly-summary")
def resumo_semanal(
    db: Session = Depends(get_db),
    utilizador_atual: models.Usuario = Depends(security.obter_usuario_atual),
):
    # 1. Definir o intervalo de tempo (últimos 7 dias)
    hoje = datetime.now(timezone.utc).date()
    inicio_semana = hoje - timedelta(days=7)

    # 2. Filtrar treinos apenas da última semana
    treinos_semana = (
        db.query(models.Workout)
        .filter(
            models.Workout.user_id == utilizador_atual.user_id,
            models.Workout.workout_date >= inicio_semana,
        )
        .all()
    )

    ids_treinos = [t.workout_id for t in treinos_semana]

    # Se não houver treinos esta semana, retorna zerado de imediato
    if not ids_treinos:
        return {
            "total_workouts": 0,
            "total_gym_sets": 0,
            "total_gym_reps": 0,
            "total_swim_m": 0,
            "running_equivalent_km": 0.0,
        }

    # 3. Agregar dados do Ginásio na BD (Soma de Sets e Reps)
    gym_stats = (
        db.query(
            func.coalesce(func.sum(models.GymExercise.sets), 0).label("total_sets"),
            func.coalesce(func.sum(models.GymExercise.reps + models.GymExercise.sets), 0).label("total_reps"),
        )
        .filter(models.GymExercise.workout_id.in_(ids_treinos))
        .first()
    )

    # 4. Agregar dados da Natação na BD (Soma de Distância * Repetições)
    swim_stats = (
        db.query(
            func.coalesce(func.sum(models.SwimSet.distance_m * models.SwimSet.reps), 0).label("total_m")
        )
        .filter(models.SwimSet.workout_id.in_(ids_treinos))
        .first()
    )

    total_swim_m = float(swim_stats.total_m)
    swim_km = total_swim_m / 1000.0
    running_equivalent_km = round(swim_km * 4, 2)

    return {
        "total_workouts": len(treinos_semana),
        "total_gym_sets": int(gym_stats.total_sets),
        "total_gym_reps": int(gym_stats.total_reps),
        "total_swim_m": int(total_swim_m),
        "running_equivalent_km": running_equivalent_km,
    }