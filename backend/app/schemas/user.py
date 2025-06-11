from pydantic import BaseModel, EmailStr, field_validator
import re
from app.config.translations import get_message


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

@field_validator('username')
@classmethod
def validate_username(cls, v):
    if not (3 <= len(v) <= 20):
        raise ValueError(get_message("username_length"))
    if not re.match(r'^[a-zA-Z0-9_-]+$', v):
        raise ValueError(get_message("username_invalid"))
    return v

@field_validator('password')
@classmethod
def validate_password(cls, v):
    if not v:
        raise ValueError(get_message("password_required"))
    if len(v) < 8:
        raise ValueError(get_message("password_length"))
    if not re.search(r'[A-Z]', v):
        raise ValueError(get_message("password_upper"))
    if not re.search(r'[a-z]', v):
        raise ValueError(get_message("password_lower"))
    if not re.search(r'[0-9]', v):
        raise ValueError(get_message("password_digit"))
    if not re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?~]", v):
        raise ValueError(get_message("password_symbol"))
    return v

class UserUpdate(BaseModel):
    username: str | None = None
    email: EmailStr | None = None
    password: str | None = None
