# backend/app/routes/auth.py
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from passlib.context import CryptContext
import jwt
import datetime
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from app.schemas.user import UserCreate, UserUpdate
from app.config.translations import get_message
from app.config.endpoints import *
from app.services.auth import authenticate_user, create_access_token  # Asegúrate de tener estos imports
from datetime import timedelta
from fastapi import Cookie



SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"
router = APIRouter(prefix=AUTH_BASE, tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=LOGIN)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)


def get_token_from_cookie(access_token: str = Cookie(None)):
    print("🔥 [DEBUG] get_token_from_cookie → access_token:", access_token)
    if access_token is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No token in cookie")
    return access_token


def get_current_user(token: str = Depends(get_token_from_cookie), db: Session = Depends(get_db)):
    print("📦 [DEBUG] get_current_user → Token recibido:", token)
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print("✅ [DEBUG] JWT Decodificado:", payload)

        username: str = payload.get("sub")
        if username is None:
            print("❌ [DEBUG] JWT sin sub")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=get_message("invalid_token", "en"))

        user = db.query(User).filter(User.email == username).first()
        if user is None:
            print("❌ [DEBUG] Usuario no encontrado en DB con email:", username)
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=get_message("user_not_found", "en"))

        print("🎉 [DEBUG] Usuario encontrado:", user.username)
        return user

    except jwt.ExpiredSignatureError:
        print("❌ [DEBUG] JWT Expirado")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=get_message("token_expired", "en"))
    except jwt.PyJWTError as e:
        print("❌ [DEBUG] Error al decodificar JWT:", e)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=get_message("invalid_token", "en"))


@router.post(REGISTER)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    # Validar si el username ya existe
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail=get_message("username_taken", "en"))

    # Validar si el email ya existe
    existing_email = db.query(User).filter(User.email == user.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail=get_message("email_taken", "en"))

    hashed_password = get_password_hash(user.password)
    new_user = User(username=user.username, email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": get_message("user_created", "en")}

@router.post(LOGIN)
def login(response: Response, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    # Sacar el rol desde el usuario
    role = user.role  # 👈 Ya debería estar en la base de datos

    access_token_expires = timedelta(minutes=60)
    access_token = create_access_token(
        data={"sub": user.email},
        role=role,
        expires_delta=access_token_expires
    )

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",   # 👈 mejor para localhost
        secure=False
    ) # Cambia a True en producción

    print("👤 [DEBUG] Login → user.username:", user.username)

    return {"access_token": access_token, "token_type": "bearer", "role": role, "email": user.email, "username": user.username}


@router.put(UPDATE_USER)
def update_user(username: str, user_data: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail=get_message("user_not_found", "en"))

    # Valida si el nuevo username ya existe en la base de datos
    if user_data.username and user_data.username != user.username:
        existing_user = db.query(User).filter(User.username == user_data.username).first()
        if existing_user:
            raise HTTPException(status_code=400, detail=get_message("username_taken", "en"))
        user.username = user_data.username

    # Valida si el nuevo email ya existe en la base de datos
    if user_data.email and user_data.email != user.email:
        existing_email = db.query(User).filter(User.email == user_data.email).first()
        if existing_email:
            raise HTTPException(status_code=400, detail=get_message("email_taken", "en"))
        user.email = user_data.email

    if user_data.password:
        user.hashed_password = get_password_hash(user_data.password)

    db.commit()
    db.refresh(user)

    return {"message": get_message("user_updated", "en")}

@router.delete(DELETE_USER)
def delete_user(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if user:
        db.delete(user)
        db.commit()
        return {"message": get_message("user_deleted", "en")}
    return {"message": get_message("user_not_found", "en")}

@router.get("/session")
def check_session(current_user: User = Depends(get_current_user)):
    return {
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role
    }

@router.get("/me")
def get_logged_user(current_user: User = Depends(get_current_user)):
    return {"username": current_user.username, "email": current_user.email, "role": current_user.role}
