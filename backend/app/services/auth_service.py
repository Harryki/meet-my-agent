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

    google_email = google_info.get("email", "")
    user_email = email or google_email
    if not user_email:
        raise ValueError("Email not provided and not available from Google")

    existing = await db.execute(select(User).where(User.email == user_email))
    if existing.scalar_one_or_none():
        raise ValueError("User already exists")

    user = User(
        email=user_email,
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


async def _find_user_by_google_info(
    db: AsyncSession, google_info: dict
) -> User | None:
    result = await db.execute(
        select(User).where(User.google_sub == google_info.get("id"))
    )
    user = result.scalar_one_or_none()
    if user is None:
        result = await db.execute(
            select(User).where(User.email == google_info.get("email"))
        )
        user = result.scalar_one_or_none()
    return user


async def login_or_register_user(db: AsyncSession, code: str) -> dict:
    google_info = await verify_google_token(code)
    if google_info is None:
        raise ValueError("Google token verification failed")

    user = await _find_user_by_google_info(db, google_info)

    if user is None:
        google_email = google_info.get("email", "")
        if not google_email:
            raise ValueError("Email not provided and not available from Google")

        user = User(
            email=google_email,
            name=google_info.get("name", ""),
            avatar_url=google_info.get("picture"),
            role=UserRole.provider,
            google_sub=google_info.get("id"),
        )
        db.add(user)
        await db.flush()

        agent = Agent(
            user_id=user.id,
            name=f"{google_info.get('name', '')}'s Agent",
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
    else:
        google_sub = google_info.get("id")
        if user.google_sub != google_sub:
            user.google_sub = google_sub
        await db.commit()
        await db.refresh(user)

    access_token = create_access_token(sub=user.uuid, extra_claims={"role": user.role.value})
    refresh_token = create_refresh_token(sub=user.uuid)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user,
    }
