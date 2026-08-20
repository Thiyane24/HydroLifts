from fastapi import APIRouter, Depends
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
    treinos = db.query(models.Workout).filter(models.Workout.user_id == utilizador_atual.user_id).all()

    total_gym_sets = 0
    total_gym_reps = 0
    total_swim_distance_m = 0

    for treino in treinos:
        for exercicio in treino.exercicios_ginasio:
            total_gym_sets += exercicio.sets
            total_gym_reps += exercicio.reps

        for serie in treino.series_natacao:
            total_swim_distance_m += serie.distance_m * serie.reps

    swim_km = total_swim_distance_m / 1000
    running_equivalent_km = swim_km * 4

    return {
        "total_workouts": len(treinos),
        "total_gym_sets": total_gym_sets,
        "total_gym_reps": total_gym_reps,
        "total_swim_m": total_swim_distance_m,
        "running_equivalent_km": running_equivalent_km,
    }