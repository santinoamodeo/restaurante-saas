from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.deps import get_current_user, get_current_tenant
from app.models.menu import MenuCategory, MenuItem
from app.models.user import User
from app.models.tenant import Tenant
from app.schemas.menu import (
    CategoryCreate, CategoryUpdate, CategoryResponse,
    MenuItemCreate, MenuItemUpdate, MenuItemResponse,
    CategoryWithItems, PublicMenuResponse
)
from app.services.cloudinary_service import upload_image
import uuid

router = APIRouter(tags=["menu"])

# ── Público (sin auth) ──────────────────────────────────────

@router.get("/public/{tenant_slug}/menu", response_model=PublicMenuResponse)
async def get_public_menu(tenant_slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tenant).where(Tenant.slug == tenant_slug))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Restaurante no encontrado")

    result = await db.execute(
        select(MenuCategory)
        .where(MenuCategory.tenant_id == tenant.id, MenuCategory.is_active == True)
        .options(selectinload(MenuCategory.items))
        .order_by(MenuCategory.order_index)
    )
    categories = result.scalars().all()
    return PublicMenuResponse(
        tenant_name=tenant.name,
        primary_color=tenant.primary_color,
        logo_url=tenant.logo_url,
        bank_info=tenant.bank_info,
        categories=categories,
    )

# ── Admin (con auth) ────────────────────────────────────────

@router.get("/admin/menu/categories", response_model=list[CategoryResponse])
async def list_categories(
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(MenuCategory)
        .where(MenuCategory.tenant_id == tenant.id)
        .order_by(MenuCategory.order_index)
    )
    return result.scalars().all()

@router.post("/admin/menu/categories", response_model=CategoryResponse)
async def create_category(
    data: CategoryCreate,
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db)
):
    category = MenuCategory(id=uuid.uuid4(), tenant_id=tenant.id, **data.model_dump())
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category

@router.put("/admin/menu/categories/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: uuid.UUID,
    data: CategoryUpdate,
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(MenuCategory).where(MenuCategory.id == category_id, MenuCategory.tenant_id == tenant.id)
    )
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")

    for key, value in data.model_dump(exclude_none=True).items():
        setattr(category, key, value)

    await db.commit()
    await db.refresh(category)
    return category

@router.delete("/admin/menu/categories/{category_id}")
async def delete_category(
    category_id: uuid.UUID,
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(MenuCategory).where(MenuCategory.id == category_id, MenuCategory.tenant_id == tenant.id)
    )
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    await db.delete(category)
    await db.commit()
    return {"message": "Categoría eliminada"}

@router.get("/admin/menu/items", response_model=list[MenuItemResponse])
async def list_items(
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(MenuItem).where(MenuItem.tenant_id == tenant.id).order_by(MenuItem.order_index)
    )
    return result.scalars().all()

@router.post("/admin/menu/items", response_model=MenuItemResponse)
async def create_item(
    data: MenuItemCreate,
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db)
):
    item = MenuItem(id=uuid.uuid4(), tenant_id=tenant.id, **data.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item

@router.put("/admin/menu/items/{item_id}", response_model=MenuItemResponse)
async def update_item(
    item_id: uuid.UUID,
    data: MenuItemUpdate,
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(MenuItem).where(MenuItem.id == item_id, MenuItem.tenant_id == tenant.id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")

    for key, value in data.model_dump(exclude_none=True).items():
        setattr(item, key, value)

    await db.commit()
    await db.refresh(item)
    return item

@router.post("/admin/menu/items/{item_id}/image", response_model=MenuItemResponse)
async def upload_item_image(
    item_id: uuid.UUID,
    file: UploadFile = File(...),
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(MenuItem).where(MenuItem.id == item_id, MenuItem.tenant_id == tenant.id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")

    file_bytes = await file.read()
    public_id = f"{tenant.slug}-item-{item_id}"
    item.image_url = await upload_image(file_bytes, public_id)

    await db.commit()
    await db.refresh(item)
    return item


@router.delete("/admin/menu/items/{item_id}")
async def delete_item(
    item_id: uuid.UUID,
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(MenuItem).where(MenuItem.id == item_id, MenuItem.tenant_id == tenant.id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")
    await db.delete(item)
    await db.commit()
    return {"message": "Item eliminado"}