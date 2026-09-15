from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

import models
import schemas
import security
from database import get_db
from services.workout_service import WorkoutService

router = APIRouter()


@router.post("/templates", response_model=schemas.WorkoutTemplateResponse, status_code=status.HTTP_201_CREATED)
def criar_template(
    template: schemas.WorkoutTemplateCreate,
    db: Session = Depends(get_db),
    utilizador_atual: models.Usuario = Depends(security.obter_usuario_atual),
):
    return WorkoutService.create_template(db, template, utilizador_atual.user_id)


@router.get("/templates", response_model=list[schemas.WorkoutTemplateResponse])
def listar_templates(
    db: Session = Depends(get_db),
    utilizador_atual: models.Usuario = Depends(security.obter_usuario_atual),
):
    return WorkoutService.list_templates(db, utilizador_atual.user_id)


@router.delete("/templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def apagar_template(
    template_id: int,
    db: Session = Depends(get_db),
    utilizador_atual: models.Usuario = Depends(security.obter_usuario_atual),
):
    WorkoutService.delete_template(db, template_id, utilizador_atual.user_id)
    return
