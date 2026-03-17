import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os

async def migrate():
    engine = create_async_engine(os.environ['DATABASE_URL'])
    async with engine.begin() as conn:
        await conn.execute(text("ALTER TYPE paymentmethod ADD VALUE IF NOT EXISTS 'transfer'"))
        print('OK')

asyncio.run(migrate())