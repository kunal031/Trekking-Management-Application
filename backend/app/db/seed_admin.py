import asyncio
import os

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
from app.models.enums import UserRole
from app.models.user import User


async def seed_admin() -> None:
    email = os.getenv("ADMIN_EMAIL", "admin@example.com")
    password = os.getenv("ADMIN_PASSWORD", "Admin12345!")

    async with AsyncSessionLocal() as session:
        user = await session.scalar(select(User).where(User.email == email))
        if user:
            user.password_hash = hash_password(password)
            user.role = UserRole.ADMIN
            user.is_active = True
            user.is_blacklisted = False
        else:
            user = User(
                email=email,
                password_hash=hash_password(password),
                first_name="System",
                last_name="Admin",
                role=UserRole.ADMIN,
                is_active=True,
                is_blacklisted=False,
            )
            session.add(user)
        await session.commit()
        print(f"Admin user ready: {email}")


if __name__ == "__main__":
    asyncio.run(seed_admin())
