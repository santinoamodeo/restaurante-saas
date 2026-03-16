import asyncio
from app.core.database import engine
from sqlalchemy import text

async def migrate():
    async with engine.begin() as conn:
        await conn.execute(text("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'superadmin'"))
        await conn.execute(text("ALTER TABLE users ALTER COLUMN tenant_id DROP NOT NULL"))
        print('Migraciones Neon OK')

asyncio.run(migrate())