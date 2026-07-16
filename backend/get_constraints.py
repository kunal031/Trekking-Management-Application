import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from app.core.config import settings

async def main():
    engine = create_async_engine(settings.database_url, echo=False)
    async with engine.connect() as conn:
        result = await conn.execute(text("SELECT conname FROM pg_constraint WHERE conrelid = 'bookings'::regclass;"))
        for row in result:
            print(row[0])
            
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
