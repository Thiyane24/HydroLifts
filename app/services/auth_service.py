from sqlalchemy.orm import Session
from fastapi import HTTPException, status

import models
import schemas
import security

class AuthService:
    """
    Service layer for authentication and user management.
    """

    @staticmethod
    def register_user(db: Session, user_data: schemas.UserCreate) -> models.Usuario:
        utilizador_existente = db.query(models.Usuario).filter(models.Usuario.email == user_data.email).first()
        if utilizador_existente:
            raise HTTPException(status_code=400, detail="Email já registado")

        hash_senha = security.gerar_hash_senha(user_data.password)
        novo_usuario = models.Usuario(
            email=user_data.email,
            password_hash=hash_senha,
        )

        db.add(novo_usuario)
        db.commit()
        db.refresh(novo_usuario)
        return novo_usuario

    @staticmethod
    def authenticate_user(db: Session, username: str, password: str) -> models.Usuario:
        usuario_banco = db.query(models.Usuario).filter(models.Usuario.email == username).first()
        if not usuario_banco or not security.verificar_senha(password, usuario_banco.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciais inválidas"
            )
        return usuario_banco

    @staticmethod
    def create_access_token(user_id: int) -> str:
        return security.criar_token_acesso(dados_payload={"sub": str(user_id)})
