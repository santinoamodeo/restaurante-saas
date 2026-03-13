from pydantic import BaseModel
import uuid
from decimal import Decimal
from app.models.order import OrderStatus, PaymentMethod
from datetime import datetime

class OrderItemCreate(BaseModel):
    menu_item_id: uuid.UUID
    quantity: int
    notes: str | None = None

class OrderCreate(BaseModel):
    customer_name: str | None = None
    customer_phone: str | None = None
    table_number: str | None = None
    notes: str | None = None
    payment_method: PaymentMethod = PaymentMethod.cash
    items: list[OrderItemCreate]

class OrderItemResponse(BaseModel):
    id: uuid.UUID
    menu_item_id: uuid.UUID
    quantity: int
    unit_price: Decimal
    subtotal: Decimal
    notes: str | None

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: uuid.UUID
    status: OrderStatus
    customer_name: str | None
    customer_phone: str | None
    table_number: str | None
    notes: str | None
    total: Decimal
    payment_method: PaymentMethod
    created_at: datetime
    items: list[OrderItemResponse] = []

    class Config:
        from_attributes = True

class OrderStatusUpdate(BaseModel):
    status: OrderStatus