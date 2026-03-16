from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "RestauranteSaaS"
    DEBUG: bool = True

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/restaurante_saas"
    DATABASE_URL_PROD: str | None = None

    SECRET_KEY: str = "cambia-esto-por-un-secreto-seguro"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 día

    SETUP_SECRET_KEY: str = "cambiar-esto"

    CALLMEBOT_API_KEY: str = ""

    CLOUDINARY_CLOUD_NAME: str = "dpz6a4lir"
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    class Config:
        env_file = ".env"

settings = Settings()