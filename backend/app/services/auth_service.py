from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, create_refresh_token, verify_google_token
from app.models.agent import Agent
from app.models.user import User, UserRole


async def register_user(
    db: AsyncSession, code: str, name: str, email: str, avatar_url: str | None
) -> dict:
    google_info = await verify_google_token(code)
    if google_info is None:
        raise ValueError("Google token verification failed")

    existing = await db.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none():
        raise ValueError("User already exists")

    user = User(
        email=email,
        name=name or google_info.get("name", ""),
        avatar_url=avatar_url or google_info.get("picture"),
        role=UserRole.provider,
        google_sub=google_info.get("id"),
    )
    db.add(user)
    await db.flush()

    agent = Agent(
        user_id=user.id,
        name=f"{name}'s Agent",
        persona="I am a helpful assistant.",
        system_prompt=(
            "You are a helpful assistant that answers questions "
            "based on the provided knowledge base."
        ),
    )
    db.add(agent)
    await db.commit()
    await db.refresh(user)
    await db.refresh(agent)

    access_token = create_access_token(sub=user.uuid, extra_claims={"role": user.role.value})
    refresh_token = create_refresh_token(sub=user.uuid)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user,
    }


async def login_user(db: AsyncSession, code: str) -> dict:
    google_info = await verify_google_token(code)
    if google_info is None:
        raise ValueError("Google token verification failed")

    result = await db.execute(select(User).where(User.google_sub == google_info.get("id")))
    user = result.scalar_one_or_none()
    if user is None:
        result = await db.execute(select(User).where(User.email == google_info.get("email")))
        user = result.scalar_one_or_none()

    if user is None:
        raise ValueError("User not found. Please register first.")

    access_token = create_access_token(sub=user.uuid, extra_claims={"role": user.role.value})
    refresh_token = create_refresh_token(sub=user.uuid)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user,
    }
