"""
Authentication API routes: Login, Sign up, Me.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import (
    authenticate_user,
    create_access_token,
    get_password_hash,
    get_current_user,
    get_user_by_email,
)
from app.database import get_db
from app.models.models import User, UserRole
from app.schemas.schemas import UserCreate, UserLogin, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["Auth"])


def _user_to_response(user: User) -> dict:
    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name or "",
        "role": user.role.value if user.role else "employee",
    }


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, db: Session = Depends(get_db)):
    """Login with email and password. Returns JWT and user info."""
    user = authenticate_user(db, data.email, data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    token = create_access_token(data={"sub": user.email})
    return TokenResponse(
        access_token=token,
        user=_user_to_response(user),
    )


@router.post("/signup", response_model=TokenResponse)
async def signup(data: UserCreate, db: Session = Depends(get_db)):
    """Create new user account. Default role is employee."""
    existing = get_user_by_email(db, data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    role = UserRole.ADMIN if data.role.lower() == "admin" else UserRole.EMPLOYEE
    user = User(
        email=data.email,
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name or "",
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(data={"sub": user.email})
    return TokenResponse(
        access_token=token,
        user=_user_to_response(user),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user."""
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name or "",
        role=current_user.role.value if current_user.role else "employee",
    )
