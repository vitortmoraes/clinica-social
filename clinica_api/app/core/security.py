from datetime import datetime, timedelta
from typing import Any, Optional, Union

import bcrypt
from jose import jwt

# from passlib.context import CryptContext

# Configuration
SECRET_KEY = "CHANGE_THIS_IN_PRODUCTION_SECRET_KEY"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        # bcrypt.checkpw expects bytes
        return bcrypt.checkpw(
            plain_password.encode("utf-8"), hashed_password.encode("utf-8")
        )
    except Exception as e:
        print(f"Error verifying password: {e}")
        return False


def get_password_hash(password: str) -> str:
    # bcrypt.hashpw returns bytes, we decode to store as string
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    return hashed.decode("utf-8")


def create_access_token(
    subject: Union[str, Any],
    role: str,
    name: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode = {"sub": str(subject), "role": role, "name": name, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


from fastapi import Depends, HTTPException, status
# OAuth2 Scheme
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        name: str = payload.get("name")
        if user_id is None or role is None:
            raise credentials_exception
        return {"id": user_id, "role": role, "name": name}
    except jwt.JWTError:
        raise credentials_exception
