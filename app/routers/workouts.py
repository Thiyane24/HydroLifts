from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

import models
import schemas
import security
from database import get_db
from services.workout_service import WorkoutService

router = APIRouter()


@router.post("/workouts", response_model=schemas.WorkoutResponse)
def criar_treino(
    treino: schemas.WorkoutCreate,
    db: Session = Depends(get_db),
    utilizador_atual: models.Usuario = Depends(security.obter_usuario_atual),
):
    return WorkoutService.create_workout(db, treino, utilizador_atual.user_id)


@router.get("/workouts", response_model=list[schemas.WorkoutResponse])
def listar_treinos(
    db: Session = Depends(get_db),
    utilizador_atual: models.Usuario = Depends(security.obter_usuario_atual),
):
    return WorkoutService.list_workouts(db, utilizador_atual.user_id)


@router.get("/workouts/{workout_id}", response_model=schemas.WorkoutResponse)
def buscar_treino(
    workout_id: int,
    db: Session = Depends(get_db),
    utilizador_atual: models.Usuario = Depends(security.obter_usuario_atual),
):
    return WorkoutService.get_workout_by_id(db, workout_id, utilizador_atual.user_id)


@router.put("/workouts/{workout_id}", response_model=schemas.WorkoutResponse)
def atualizar_treino(
    workout_id: int,
    treino_atualizado: schemas.WorkoutCreate,
    db: Session = Depends(get_db),
    utilizador_atual: models.Usuario = Depends(security.obter_usuario_atual),
):
    return WorkoutService.update_workout(db, workout_id, treino_atualizado, utilizador_atual.user_id)


@router.delete(
    "/workouts/{workout_id}", status_code=status.HTTP_204_NO_CONTENT
)
def apagar_treino(
    workout_id: int,
    db: Session = Depends(get_db),
    utilizador_atual: models.Usuario = Depends(security.obter_usuario_atual),
):
    WorkoutService.delete_workout(db, workout_id, utilizador_atual.user_id)
    return
