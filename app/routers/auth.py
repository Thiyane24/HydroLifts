from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from services.auth_service import AuthService

router = APIRouter()


@router.post("/auth/register", response_model=schemas.UserResponse)
def registar(user: schemas.UserCreate, db: Session = Depends(get_db)):
    return AuthService.register_user(db, user)


@router.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    usuario = AuthService.authenticate_user(db, form_data.username, form_data.password)
    token = AuthService.create_access_token(usuario.user_id)

    return {
        "access_token": token,
        "token_type": "bearer",
    }
