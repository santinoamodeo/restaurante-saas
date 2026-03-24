from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.security import hash_password, verify_password, create_access_token
from app.models.tenant import Tenant, PlanType
from app.models.user import User, UserRole
from app.models.order import Order
from pydantic import BaseModel
from typing import Optional
import uuid

router = APIRouter(tags=["superadmin"])


async def require_superadmin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.superadmin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso restringido a superadmin")
    return current_user


class SuperadminLoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
async def superadmin_login(
    data: SuperadminLoginRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        text("SELECT * FROM users WHERE email = :email AND role = 'superadmin' LIMIT 1"),
        {"email": data.email},
    )
    row = result.mappings().first()

    if not row or not verify_password(data.password, row["hashed_password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas")

    token = create_access_token({
        "sub": str(row["id"]),
        "tenant_id": None,
        "role": "superadmin",
    })

    return {"access_token": token, "token_type": "bearer"}


class CreateTenantRequest(BaseModel):
    tenant_name: str
    tenant_slug: str
    admin_email: str
    admin_password: str


@router.get("/tenants")
async def list_tenants(
    _: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
):
    order_counts = (
        select(Order.tenant_id, func.count(Order.id).label("total_orders"))
        .group_by(Order.tenant_id)
        .subquery()
    )
    owner_subq = (
        select(
            User.tenant_id,
            User.email.label("owner_email"),
            User.full_name.label("owner_name"),
            User.phone.label("owner_phone"),
        )
        .where(User.role == UserRole.owner)
        .distinct(User.tenant_id)
        .subquery()
    )
    result = await db.execute(
        select(
            Tenant,
            func.coalesce(order_counts.c.total_orders, 0).label("total_orders"),
            owner_subq.c.owner_email,
            owner_subq.c.owner_name,
            owner_subq.c.owner_phone,
        )
        .outerjoin(order_counts, Tenant.id == order_counts.c.tenant_id)
        .outerjoin(owner_subq, Tenant.id == owner_subq.c.tenant_id)
        .order_by(Tenant.created_at.desc())
    )
    rows = result.all()
    return [
        {
            "id": str(row.Tenant.id),
            "name": row.Tenant.name,
            "slug": row.Tenant.slug,
            "plan": row.Tenant.plan,
            "is_active": row.Tenant.is_active,
            "created_at": row.Tenant.created_at,
            "total_orders": row.total_orders,
            "owner_email": row.owner_email,
            "owner_name": row.owner_name,
            "owner_phone": row.owner_phone,
            "billing_day": row.Tenant.billing_day,
            "internal_notes": row.Tenant.internal_notes,
            "plan_price": row.Tenant.plan_price,
        }
        for row in rows
    ]


class UpdateTenantRequest(BaseModel):
    plan: Optional[PlanType] = None
    billing_day: Optional[int] = None
    plan_price: Optional[int] = None
    internal_notes: Optional[str] = None
    owner_name: Optional[str] = None
    owner_phone: Optional[str] = None


@router.patch("/tenants/{tenant_id}")
async def update_tenant(
    tenant_id: uuid.UUID,
    data: UpdateTenantRequest,
    _: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant no encontrado")

    if data.plan is not None:
        tenant.plan = data.plan
    if data.billing_day is not None:
        tenant.billing_day = data.billing_day
    if data.plan_price is not None:
        tenant.plan_price = data.plan_price
    if data.internal_notes is not None:
        tenant.internal_notes = data.internal_notes

    if data.owner_name is not None or data.owner_phone is not None:
        owner_result = await db.execute(
            select(User).where(User.tenant_id == tenant_id, User.role == UserRole.owner)
        )
        owner = owner_result.scalars().first()
        if owner:
            if data.owner_name is not None:
                owner.full_name = data.owner_name
            if data.owner_phone is not None:
                owner.phone = data.owner_phone

    await db.commit()
    return {"ok": True}


@router.post("/tenants", status_code=status.HTTP_201_CREATED)
async def create_tenant(
    data: CreateTenantRequest,
    _: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Tenant).where(Tenant.slug == data.tenant_slug))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="El slug ya existe")

    tenant = Tenant(id=uuid.uuid4(), slug=data.tenant_slug, name=data.tenant_name)
    db.add(tenant)
    await db.flush()

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
        "message": "Tenant y admin creados correctamente",
    }


@router.patch("/tenants/{tenant_id}/toggle")
async def toggle_tenant(
    tenant_id: uuid.UUID,
    _: User = Depends(require_superadmin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant no encontrado")

    tenant.is_active = not tenant.is_active
    await db.commit()

    return {"id": str(tenant.id), "is_active": tenant.is_active}
