import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
import os

async def migrate():
    engine = create_async_engine(os.environ['DATABASE_URL'])
    async with engine.begin() as conn:
        await conn.execute(text('ALTER TABLE tenants ADD COLUMN IF NOT EXISTS address VARCHAR(500)'))
        print('OK')

asyncio.run(migrate())