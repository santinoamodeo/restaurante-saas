from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.deps import get_current_tenant
from app.models.order import Order, OrderItem, OrderStatus
from app.models.tenant import Tenant
from app.schemas.order import OrderCreate, OrderResponse, OrderStatusUpdate
from app.services.order_service import create_order
from app.services.whatsapp_service import send_order_notification
import uuid
import io
import qrcode

router = APIRouter(tags=["orders"])

# ── Público ─────────────────────────────────────────────────

@router.post("/public/{tenant_slug}/orders", response_model=OrderResponse)
async def place_order(
    tenant_slug: str,
    data: OrderCreate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Tenant).where(Tenant.slug == tenant_slug))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Restaurante no encontrado")

    order = await create_order(tenant.id, data, db)
    await send_order_notification(order, tenant)
    return order

@router.get("/public/{tenant_slug}/orders/{order_id}", response_model=OrderResponse)
async def get_public_order(
    tenant_slug: str,
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Tenant).where(Tenant.slug == tenant_slug))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Restaurante no encontrado")

    result = await db.execute(
        select(Order)
        .where(Order.id == order_id, Order.tenant_id == tenant.id)
        .options(selectinload(Order.items).selectinload(OrderItem.menu_item))
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return order

@router.get("/public/{tenant_slug}/qr/general")
async def get_general_qr(tenant_slug: str):
    url = f"https://trayly.com.ar/{tenant_slug}"
    img = qrcode.make(url)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return Response(content=buf.getvalue(), media_type="image/png")

@router.get("/public/{tenant_slug}/qr/{table_number}")
async def get_table_qr(tenant_slug: str, table_number: str):
    url = f"https://restaurante-saas-alpha.vercel.app/{tenant_slug}?mesa={table_number}"
    img = qrcode.make(url)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return Response(content=buf.getvalue(), media_type="image/png")

# ── Admin ────────────────────────────────────────────────────

@router.get("/admin/orders", response_model=list[OrderResponse])
async def list_orders(
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Order)
        .where(Order.tenant_id == tenant.id)
        .options(selectinload(Order.items).selectinload(OrderItem.menu_item))
        .order_by(Order.created_at.desc())
    )
    return result.scalars().all()

@router.get("/admin/orders/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: uuid.UUID,
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id, Order.tenant_id == tenant.id)
        .options(selectinload(Order.items).selectinload(OrderItem.menu_item))
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    return order

@router.patch("/admin/orders/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: uuid.UUID,
    data: OrderStatusUpdate,
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id, Order.tenant_id == tenant.id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")

    order.status = data.status
    await db.commit()

    result = await db.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(selectinload(Order.items).selectinload(OrderItem.menu_item))
    )
    return result.scalar_one()

@router.delete("/admin/orders/{order_id}")
async def delete_order(
    order_id: uuid.UUID,
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id, Order.tenant_id == tenant.id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Pedido no encontrado")
    await db.delete(order)
    await db.commit()
    return {"message": "Pedido eliminado"}