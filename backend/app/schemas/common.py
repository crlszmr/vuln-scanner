# backend/app/schemas/common.py

from pydantic import BaseModel

class PasswordConfirmation(BaseModel):
    password: str