import httpx
from app.models.order import Order
from app.models.tenant import Tenant

async def send_order_notification(order: Order, tenant: Tenant):
    if not tenant.whatsapp_number or not tenant.callmebot_api_key:
        return

    items_text = "\n".join([
        f"  - {item.quantity}x item (${item.subtotal})"
        for item in order.items
    ])

    message = (
        f"🍽️ NUEVO PEDIDO #{str(order.id)[:8].upper()}\n"
        f"Mesa: {order.table_number or 'Sin mesa'}\n"
        f"Cliente: {order.customer_name or 'Sin nombre'}\n"
        f"Tel: {order.customer_phone or '-'}\n"
        f"\nItems:\n{items_text}\n"
        f"\nTOTAL: ${order.total}\n"
        f"Pago: {order.payment_method.value}"
    )

    url = "https://api.callmebot.com/whatsapp.php"
    params = {
        "phone": tenant.whatsapp_number,
        "text": message,
        "apikey": tenant.callmebot_api_key
    }

    try:
        async with httpx.AsyncClient() as client:
            await client.get(url, params=params, timeout=10)
    except Exception:
        pass  # No bloqueamos el pedido si falla WhatsApp