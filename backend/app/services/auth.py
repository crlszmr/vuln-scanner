# backend/app/services/auth.py

from datetime import datetime, timedelta
from typing import Optional
from passlib.context import CryptContext
from jose import jwt
from app.models.user import User
from app.database import SessionLocal

# Configuraciones de JWT
SECRET_KEY = "supersecretkey"  # Usa tu real secret key (ya la tienes definida en auth.py)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def authenticate_user(db, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()  # 👈 Buscar por email
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user

def create_access_token(data: dict, role: str, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))

    # Añadir expiración y rol al token
    to_encode.update({
        "exp": expire,
        "role": role
    })

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
