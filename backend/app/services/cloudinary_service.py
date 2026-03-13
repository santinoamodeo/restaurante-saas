import cloudinary
import cloudinary.uploader
from app.core.config import settings


def _configure():
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )


async def upload_image(file_bytes: bytes, public_id: str) -> str:
    """Sube imagen a Cloudinary y devuelve la URL segura."""
    _configure()
    result = cloudinary.uploader.upload(
        file_bytes,
        public_id=public_id,
        overwrite=True,
        folder="restaurante-saas/menu",
    )
    return result["secure_url"]
