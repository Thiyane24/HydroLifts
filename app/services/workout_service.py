from sqlalchemy.orm import Session
from fastapi import HTTPException, status

import models
import schemas

class WorkoutService:
    """
    Service layer for managing workouts and their associated exercises/sets.
    """

    @staticmethod
    def create_workout(db: Session, workout_data: schemas.WorkoutCreate, user_id: int) -> models.Workout:
# ... (rest of the method)
        try:
            novo_treino = models.Workout(
                workout_date=workout_data.workout_date,
                workout_type=workout_data.workout_type,
                user_id=user_id,
            )
            db.add(novo_treino)
            db.commit()
            db.refresh(novo_treino)

            if workout_data.exercicios_ginasio:
                for exercicio in workout_data.exercicios_ginasio:
                    detalhes = exercicio.series_detalhadas or []
                    payload = exercicio.model_dump(exclude={"series_detalhadas"})
                    novo_exercicio = models.GymExercise(
                        **payload,
                        workout_id=novo_treino.workout_id,
                    )
                    for detalhe in detalhes:
                        novo_exercicio.series_detalhadas.append(
                            models.GymSetDetail(**detalhe.model_dump())
                        )
                    db.add(novo_exercicio)

            if workout_data.series_natacao:
                for serie in workout_data.series_natacao:
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

    @staticmethod
    def list_workouts(db: Session, user_id: int) -> list[models.Workout]:
        return (
            db.query(models.Workout)
            .filter(models.Workout.user_id == user_id)
            .all()
        )

    @staticmethod
    def get_workout_by_id(db: Session, workout_id: int, user_id: int) -> models.Workout:
        treino = (
            db.query(models.Workout)
            .filter(
                models.Workout.workout_id == workout_id,
                models.Workout.user_id == user_id,
            )
            .first()
        )
        if not treino:
            raise HTTPException(status_code=404, detail="Treino não encontrado")
        return treino

    @staticmethod
    def update_workout(db: Session, workout_id: int, workout_update: schemas.WorkoutCreate, user_id: int) -> models.Workout:
        try:
            treino = WorkoutService.get_workout_by_id(db, workout_id, user_id)

            # Update main fields
            treino.workout_date = workout_update.workout_date
            treino.workout_type = workout_update.workout_type

            # Replace gym exercises (using cascade delete-orphan)
            novos_exercicios = []
            for exercicio in (workout_update.exercicios_ginasio or []):
                payload = exercicio.model_dump(exclude={"series_detalhadas"})
                novo = models.GymExercise(**payload)
                for detalhe in (exercicio.series_detalhadas or []):
                    novo.series_detalhadas.append(
                        models.GymSetDetail(**detalhe.model_dump())
                    )
                novos_exercicios.append(novo)
            treino.exercicios_ginasio = novos_exercicios

            # Replace swim sets
            treino.series_natacao = [
                models.SwimSet(**serie.model_dump())
                for serie in (workout_update.series_natacao or [])
            ]

            db.commit()
            db.refresh(treino)
            return treino
        except HTTPException:
            raise
        except Exception:
            db.rollback()
            raise

    @staticmethod
    def delete_workout(db: Session, workout_id: int, user_id: int) -> None:
        try:
            treino = WorkoutService.get_workout_by_id(db, workout_id, user_id)
            db.delete(treino)
            db.commit()
        except HTTPException:
            raise
        except Exception:
            db.rollback()
            raise

    # --- Templates ---

    @staticmethod
    def create_template(db: Session, template_data: schemas.WorkoutTemplateCreate, user_id: int) -> models.WorkoutTemplate:
        novo_template = models.WorkoutTemplate(
            **template_data.model_dump(),
            user_id=user_id,
        )
        db.add(novo_template)
        db.commit()
        db.refresh(novo_template)
        return novo_template

    @staticmethod
    def list_templates(db: Session, user_id: int) -> list[models.WorkoutTemplate]:
        return db.query(models.WorkoutTemplate).filter(models.WorkoutTemplate.user_id == user_id).all()

    @staticmethod
    def delete_template(db: Session, template_id: int, user_id: int) -> None:
        template = db.query(models.WorkoutTemplate).filter(
            models.WorkoutTemplate.template_id == template_id,
            models.WorkoutTemplate.user_id == user_id
        ).first()
        if not template:
            raise HTTPException(status_code=404, detail="Template não encontrado")
        db.delete(template)
        db.commit()
