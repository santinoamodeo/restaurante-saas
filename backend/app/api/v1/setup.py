from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import hash_password
from app.models.tenant import Tenant
from app.models.user import User, UserRole
from pydantic import BaseModel
import uuid

router = APIRouter(prefix="/setup", tags=["setup"])

class SetupRequest(BaseModel):
    tenant_name: str
    tenant_slug: str
    admin_email: str
    admin_password: str

@router.post("/create-tenant")
async def create_tenant(data: SetupRequest, db: AsyncSession = Depends(get_db)):
    # Verificar que el slug no exista
    result = await db.execute(select(Tenant).where(Tenant.slug == data.tenant_slug))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="El slug ya existe")

    # Crear tenant
    tenant = Tenant(
        id=uuid.uuid4(),
        slug=data.tenant_slug,
        name=data.tenant_name,
    )
    db.add(tenant)
    await db.flush()

    # Crear usuario admin
    user = User(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        email=data.admin_email,
        hashed_password=hash_password(data.admin_password),
        role=UserRole.owner,
    )
    db.add(user)
    await db.commit()

    return {
        "tenant_id": str(tenant.id),
        "tenant_slug": tenant.slug,
        "user_email": user.email,
        "message": "Tenant y admin creados correctamente"
    }