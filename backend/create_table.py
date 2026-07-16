import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import settings
from app.models.password_reset import PasswordResetRequest

async def main():
    engine = create_async_engine(settings.database_url, echo=True)
    async with engine.begin() as conn:
        await conn.run_sync(PasswordResetRequest.__table__.create, checkfirst=True)
    await engine.dispose()
    print("Table created.")

if __name__ == "__main__":
    asyncio.run(main())
