import asyncio
from app.core.database import AsyncSessionLocal
from app.models.user import User, UserRole
from app.core.security import hash_password
import uuid
from datetime import datetime

async def create():
    async with AsyncSessionLocal() as db:
        user = User(
            id=uuid.uuid4(),
            tenant_id=None,
            email='santino@superadmin.com',
            hashed_password=hash_password('superadmin123'),
            role=UserRole.superadmin,
            is_active=True,
            created_at=datetime.utcnow()
        )
        db.add(user)
        await db.commit()
        print('Superadmin creado OK')

asyncio.run(create())