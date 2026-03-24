import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, Enum as SAEnum, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
import enum

class PlanType(str, enum.Enum):
    free = "free"
    starter = "starter"
    pro = "pro"

class Tenant(Base):
    __tablename__ = "tenants"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    custom_domain: Mapped[str | None] = mapped_column(String(200), nullable=True)
    plan: Mapped[PlanType] = mapped_column(SAEnum(PlanType), default=PlanType.free)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    whatsapp_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    callmebot_api_key: Mapped[str | None] = mapped_column(String(100), nullable=True)
    primary_color: Mapped[str] = mapped_column(String(7), nullable=False, default="#E85D04")
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    bank_info: Mapped[str | None] = mapped_column(String(300), nullable=True)
    address: Mapped[str | None] = mapped_column(String(400), nullable=True)
    billing_day: Mapped[int | None] = mapped_column(Integer, nullable=True)
    internal_notes: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    plan_price: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)