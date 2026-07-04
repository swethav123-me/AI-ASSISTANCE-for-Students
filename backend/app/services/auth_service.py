from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.models.user import User
from app.schemas import UserCreate
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token, decode_token
from app.core.exceptions import AuthenticationError, ConflictError, NotFoundError


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(self, data: UserCreate) -> tuple[User, str, str]:
        existing = await self.db.execute(
            select(User).where((User.email == data.email) | (User.username == data.username))
        )
        if existing.scalar_one_or_none():
            raise ConflictError("Email or username already exists")

        user = User(
            email=data.email,
            username=data.username,
            hashed_password=get_password_hash(data.password),
            full_name=data.full_name,
            role=data.role,
        )
        self.db.add(user)
        await self.db.flush()

        access_token = create_access_token(subject=user.id, additional_claims={"role": user.role})
        refresh_token = create_refresh_token(subject=user.id)
        return user, access_token, refresh_token

    async def login(self, email: str, password: str) -> tuple[User, str, str]:
        result = await self.db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

        if user:
            if not verify_password(password, user.hashed_password):
                raise AuthenticationError("Invalid email or password")
            if not user.is_active:
                raise AuthenticationError("Account is deactivated")
        else:
            username = email.split("@")[0]
            user = User(
                email=email,
                username=username,
                hashed_password=get_password_hash(password),
                full_name=username,
            )
            self.db.add(user)
            await self.db.flush()

        access_token = create_access_token(subject=user.id, additional_claims={"role": user.role})
        refresh_token = create_refresh_token(subject=user.id)
        return user, access_token, refresh_token

    async def refresh_token(self, refresh_token: str) -> tuple[str, str]:
        payload = decode_token(refresh_token)
        if payload.get("type") != "refresh":
            raise AuthenticationError("Invalid refresh token")
        user_id = int(payload.get("sub"))
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise NotFoundError("User not found")

        new_access = create_access_token(subject=user.id, additional_claims={"role": user.role})
        new_refresh = create_refresh_token(subject=user.id)
        return new_access, new_refresh

    async def get_user_by_id(self, user_id: int) -> User:
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise NotFoundError("User not found")
        return user

    async def update_user(self, user_id: int, data: dict) -> User:
        user = await self.get_user_by_id(user_id)
        for key, value in data.items():
            if value is not None and hasattr(user, key):
                setattr(user, key, value)
        await self.db.flush()
        return user