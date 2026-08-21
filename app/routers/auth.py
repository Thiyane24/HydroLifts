from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

import models
import schemas
import security
from database import get_db

router = APIRouter()


@router.post("/auth/register", response_model=schemas.UserResponse)
def registar(user: schemas.UserCreate, db: Session = Depends(get_db)):
    try:
        utilizador_existente = db.query(models.Usuario).filter(models.Usuario.email == user.email).first()

        if utilizador_existente:
            raise HTTPException(status_code=400, detail="Email já registado")

        hash_senha = security.gerar_hash_senha(user.password)

        novo_usuario = models.Usuario(
            email=user.email,
            password_hash=hash_senha,
        )

        db.add(novo_usuario)
        db.commit()
        db.refresh(novo_usuario)

        return novo_usuario
    except HTTPException:
        raise
    except Exception:
        db.rollback()
        raise


@router.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    usuario_banco = db.query(models.Usuario).filter(models.Usuario.email == form_data.username).first()

    if not usuario_banco or not security.verificar_senha(form_data.password, usuario_banco.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais inválidas")

    token = security.criar_token_acesso(dados_payload={"sub": str(usuario_banco.user_id)})

    return {
        "access_token": token,
        "token_type": "bearer",
    }