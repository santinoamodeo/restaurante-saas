import asyncio
import logging
from datetime import datetime, timedelta

import httpx
from sqlalchemy import text

from app.core.config import settings
from app.core.database import AsyncSessionLocal

logger = logging.getLogger(__name__)

ALERT_COOLDOWN = timedelta(hours=1)
MONITOR_INTERVAL = 20 * 60  # seconds
ALERT_TO = "santinoamodeoph@gmail.com"

_last_alert: dict[str, datetime] = {}


async def check_db() -> tuple[bool, str]:
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        return True, "ok"
    except Exception as e:
        return False, str(e)


async def check_http(url: str, timeout: float = 10.0) -> tuple[bool, str]:
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            r = await client.get(url)
            if r.status_code >= 500:
                return False, f"HTTP {r.status_code}"
            return True, "ok"
    except Exception as e:
        return False, str(e)


async def send_alert(service_name: str, error: str) -> None:
    now = datetime.utcnow()
    last = _last_alert.get(service_name)
    if last and (now - last) < ALERT_COOLDOWN:
        logger.info(f"Alert for '{service_name}' skipped (cooldown active)")
        return

    _last_alert[service_name] = now

    if not settings.RESEND_API_KEY:
        logger.warning(f"RESEND_API_KEY not set — skipping alert email for '{service_name}'")
        return

    try:
        import resend  # type: ignore
        resend.api_key = settings.RESEND_API_KEY
        resend.Emails.send({
            "from": "monitor@trayly.com.ar",
            "to": ALERT_TO,
            "subject": f"🚨 Trayly - Servicio caído: {service_name}",
            "html": (
                f"<h2>🚨 Servicio caído: {service_name}</h2>"
                f"<p><strong>Error:</strong> {error}</p>"
                f"<p><strong>Timestamp (UTC):</strong> {now.isoformat()}</p>"
                f"<hr><p style='color:#888;font-size:12px'>Trayly Monitor</p>"
            ),
        })
        logger.info(f"Alert email sent for '{service_name}'")
    except Exception as e:
        logger.error(f"Failed to send alert email for '{service_name}': {e}")


async def run_monitor() -> None:
    """Background loop: checks services every MONITOR_INTERVAL seconds."""
    logger.info("Monitor service started")
    while True:
        await asyncio.sleep(MONITOR_INTERVAL)
        logger.info("Running scheduled health checks")

        db_ok, db_err = await check_db()
        if not db_ok:
            logger.error(f"DB check failed: {db_err}")
            await send_alert("Base de datos (Neon)", db_err)
        else:
            logger.info("DB check: ok")

        backend_ok, backend_err = await check_http(
            "https://restaurante-saas-production-136b.up.railway.app/health"
        )
        if not backend_ok:
            logger.error(f"Backend check failed: {backend_err}")
            await send_alert("Backend (Railway)", backend_err)
        else:
            logger.info("Backend check: ok")
