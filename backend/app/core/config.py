from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "RestauranteSaaS"
    DEBUG: bool = True

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/restaurante_saas"

    SECRET_KEY: str = "cambia-esto-por-un-secreto-seguro"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 día

    CALLMEBOT_API_KEY: str = ""

    class Config:
        env_file = ".env"

settings = Settings()