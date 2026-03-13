from pydantic import BaseModel
import uuid
from decimal import Decimal

class CategoryCreate(BaseModel):
    name: str
    order_index: int = 0

class CategoryUpdate(BaseModel):
    name: str | None = None
    order_index: int | None = None
    is_active: bool | None = None

class CategoryResponse(BaseModel):
    id: uuid.UUID
    name: str
    order_index: int
    is_active: bool

    class Config:
        from_attributes = True

class MenuItemCreate(BaseModel):
    category_id: uuid.UUID
    name: str
    description: str | None = None
    price: Decimal
    is_available: bool = True
    order_index: int = 0

class MenuItemUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    price: Decimal | None = None
    is_available: bool | None = None
    order_index: int | None = None
    category_id: uuid.UUID | None = None

class MenuItemResponse(BaseModel):
    id: uuid.UUID
    category_id: uuid.UUID
    name: str
    description: str | None
    price: Decimal
    image_url: str | None
    is_available: bool
    order_index: int

    class Config:
        from_attributes = True

class CategoryWithItems(BaseModel):
    id: uuid.UUID
    name: str
    order_index: int
    is_active: bool
    items: list[MenuItemResponse] = []

    class Config:
        from_attributes = True