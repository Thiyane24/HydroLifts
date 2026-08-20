from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pwdlib import PasswordHash
import jwt
import os
import dotenv
import models

dotenv.load_dotenv()  # Carrega as variáveis do ficheiro .env

from models import Usuario
from database import get_db

CHAVE_SECRETA = os.getenv("Secret_Key")  # F
ALGORITMO = os.getenv("Hashing_Algorithm")  # F
TEMPO_EXPIRACAO_MINUTOS = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))  # F

pwd_hash = PasswordHash.recommended()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


# --- 1. HASHING DE PALAVRA-PASSE ---

def gerar_hash_senha(senha_em_texto_puro: str) -> str:
    return pwd_hash.hash(senha_em_texto_puro)


def verificar_senha(senha_em_texto_puro: str, senha_hash_do_banco: str) -> bool:
    return pwd_hash.verify(senha_em_texto_puro, senha_hash_do_banco)


# --- 2. GERAÇÃO DE TOKEN JWT ---

def criar_token_acesso(dados_payload: dict) -> str:
    copia_dados = dados_payload.copy()
    expira_em = datetime.now(timezone.utc) + timedelta(minutes=TEMPO_EXPIRACAO_MINUTOS)
    copia_dados.update({"exp": expira_em})

    token_jwt = jwt.encode(copia_dados, CHAVE_SECRETA, algorithm=ALGORITMO)
    return token_jwt


# --- 3. VALIDAÇÃO DO TOKEN E OBTENÇÃO DO UTILIZADOR ATUAL ---

def obter_usuario_atual(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.Usuario:
    credenciais_invalidas = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, CHAVE_SECRETA, algorithms=[ALGORITMO])
        user_id_str = payload.get("sub")

        if user_id_str is None:
            raise credenciais_invalidas

        user_id = int(user_id_str)

    except jwt.PyJWTError:
        raise credenciais_invalidas

    usuario = db.query(models.Usuario).filter(models.Usuario.user_id == user_id).first()

    if usuario is None:
        raise credenciais_invalidas

    return usuario