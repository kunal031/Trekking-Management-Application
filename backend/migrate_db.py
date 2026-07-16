import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import settings

async def main():
    engine = create_async_engine(settings.database_url, echo=True)
    async with engine.begin() as conn:
        try:
            print("Dropping constraint uq_booking_user_trek...")
            await conn.execute(text("ALTER TABLE bookings DROP CONSTRAINT uq_booking_user_trek;"))
            print("Constraint dropped.")
        except Exception as e:
            print(f"Constraint might not exist or failed to drop: {e}")
            
        try:
            print("Adding column participants to bookings...")
            await conn.execute(text("ALTER TABLE bookings ADD COLUMN participants JSONB DEFAULT '[]'::jsonb;"))
            print("Column added.")
        except Exception as e:
            print(f"Column might already exist or failed to add: {e}")
            
        try:
            print("Creating password_reset_requests table...")
            from app.models.password_reset import PasswordResetRequest
            await conn.run_sync(PasswordResetRequest.__table__.create, checkfirst=True)
            print("Table created.")
        except Exception as e:
            print(f"Failed to create table: {e}")

    await engine.dispose()
    print("Migration finished!")

if __name__ == "__main__":
    asyncio.run(main())
