from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.core.database import get_db
from app.core.deps import get_current_tenant
from app.models.tenant import Tenant

router = APIRouter(prefix="/admin/config", tags=["config"])


class TenantConfigResponse(BaseModel):
    slug: str
    whatsapp_number: str | None
    callmebot_api_key: str | None


class TenantConfigUpdate(BaseModel):
    whatsapp_number: str | None = None
    callmebot_api_key: str | None = None


@router.get("", response_model=TenantConfigResponse)
async def get_config(tenant: Tenant = Depends(get_current_tenant)):
    return TenantConfigResponse(
        slug=tenant.slug,
        whatsapp_number=tenant.whatsapp_number,
        callmebot_api_key=tenant.callmebot_api_key,
    )


@router.patch("", response_model=TenantConfigResponse)
async def update_config(
    data: TenantConfigUpdate,
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    tenant.whatsapp_number = data.whatsapp_number or None
    tenant.callmebot_api_key = data.callmebot_api_key or None
    await db.commit()
    await db.refresh(tenant)
    return TenantConfigResponse(
        slug=tenant.slug,
        whatsapp_number=tenant.whatsapp_number,
        callmebot_api_key=tenant.callmebot_api_key,
    )
