from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException
from app.models.order import Order, OrderItem
from app.models.menu import MenuItem
from app.schemas.order import OrderCreate
import uuid

async def create_order(tenant_id: uuid.UUID, data: OrderCreate, db: AsyncSession) -> Order:
    if not data.items:
        raise HTTPException(status_code=400, detail="El pedido debe tener al menos un item")

    total = 0
    order_items = []

    for item_data in data.items:
        result = await db.execute(
            select(MenuItem).where(
                MenuItem.id == item_data.menu_item_id,
                MenuItem.tenant_id == tenant_id,
                MenuItem.is_available == True
            )
        )
        menu_item = result.scalar_one_or_none()
        if not menu_item:
            raise HTTPException(
                status_code=404,
                detail=f"Item {item_data.menu_item_id} no encontrado o no disponible"
            )

        subtotal = menu_item.price * item_data.quantity
        total += subtotal

        order_items.append(OrderItem(
            id=uuid.uuid4(),
            menu_item_id=menu_item.id,
            quantity=item_data.quantity,
            unit_price=menu_item.price,
            subtotal=subtotal,
            notes=item_data.notes
        ))

    order = Order(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        customer_name=data.customer_name,
        customer_phone=data.customer_phone,
        table_number=data.table_number,
        notes=data.notes,
        payment_method=data.payment_method,
        total=total,
    )

    db.add(order)
    await db.flush()

    for item in order_items:
        item.order_id = order.id
        db.add(item)

    await db.commit()

    result = await db.execute(
        select(Order)
        .where(Order.id == order.id)
        .options(selectinload(Order.items))
    )
    return result.scalar_one()