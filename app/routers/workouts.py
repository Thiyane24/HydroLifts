from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import models
import schemas
import security
from database import get_db

router = APIRouter()


@router.post("/workouts", response_model=schemas.WorkoutResponse)
def criar_treino(
    treino: schemas.WorkoutCreate,
    db: Session = Depends(get_db),
    utilizador_atual: models.Usuario = Depends(security.obter_usuario_atual),
):
    try:
        novo_treino = models.Workout(
            workout_date=treino.workout_date,
            workout_type=treino.workout_type,
            user_id=utilizador_atual.user_id,
        )
        db.add(novo_treino)
        db.commit()
        db.refresh(novo_treino)

        if treino.exercicios_ginasio:
            for exercicio in treino.exercicios_ginasio:
                novo_exercicio = models.GymExercise(
                    **exercicio.model_dump(),
                    workout_id=novo_treino.workout_id,
                )
                db.add(novo_exercicio)

        if treino.series_natacao:
            for serie in treino.series_natacao:
                nova_serie = models.SwimSet(
                    **serie.model_dump(),
                    workout_id=novo_treino.workout_id,
                )
                db.add(nova_serie)

        db.commit()
        db.refresh(novo_treino)

        return novo_treino
    except Exception:
        db.rollback()
        raise


@router.get("/workouts", response_model=list[schemas.WorkoutResponse])
def listar_treinos(
    db: Session = Depends(get_db),
    utilizador_atual: models.Usuario = Depends(security.obter_usuario_atual),
):
    return (
        db.query(models.Workout)
        .filter(models.Workout.user_id == utilizador_atual.user_id)
        .all()
    )


@router.get("/workouts/{workout_id}", response_model=schemas.WorkoutResponse)
def buscar_treino(
    workout_id: int,
    db: Session = Depends(get_db),
    utilizador_atual: models.Usuario = Depends(security.obter_usuario_atual),
):
    treino = (
        db.query(models.Workout)
        .filter(
            models.Workout.workout_id == workout_id,
            models.Workout.user_id == utilizador_atual.user_id,
        )
        .first()
    )

    if not treino:
        raise HTTPException(status_code=404, detail="Treino não encontrado")

    return treino


@router.put("/workouts/{workout_id}", response_model=schemas.WorkoutResponse)
def atualizar_treino(
    workout_id: int,
    treino_atualizado: schemas.WorkoutCreate,
    db: Session = Depends(get_db),
    utilizador_atual: models.Usuario = Depends(security.obter_usuario_atual),
):
    try:
        # 1. Procurar o treino e validar permissão do utilizador
        treino = (
            db.query(models.Workout)
            .filter(
                models.Workout.workout_id == workout_id,
                models.Workout.user_id == utilizador_atual.user_id,
            )
            .first()
        )

        if not treino:
            raise HTTPException(status_code=404, detail="Treino não encontrado")

        # 2. Atualizar dados principais do treino
        treino.workout_date = treino_atualizado.workout_date
        treino.workout_type = treino_atualizado.workout_type

        # 3. Substituir coleções filhas — usar a cascade do ORM
        #    (cascade="all, delete-orphan") para garantir limpeza correcta.
        treino.exercicios_ginasio = [
            models.GymExercise(**exercicio.model_dump())
            for exercicio in (treino_atualizado.exercicios_ginasio or [])
        ]
        treino.series_natacao = [
            models.SwimSet(**serie.model_dump())
            for serie in (treino_atualizado.series_natacao or [])
        ]

        db.commit()
        db.refresh(treino)

        return treino
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise


@router.delete(
    "/workouts/{workout_id}", status_code=status.HTTP_204_NO_CONTENT
)
def apagar_treino(
    workout_id: int,
    db: Session = Depends(get_db),
    utilizador_atual: models.Usuario = Depends(security.obter_usuario_atual),
):
    try:
        treino = (
            db.query(models.Workout)
            .filter(
                models.Workout.workout_id == workout_id,
                models.Workout.user_id == utilizador_atual.user_id,
            )
            .first()
        )

        if not treino:
            raise HTTPException(status_code=404, detail="Treino não encontrado")

        db.delete(treino)
        db.commit()
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise
    return