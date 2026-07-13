from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/tma_v2"
    redis_url: str = "redis://localhost:6379/0"
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    frontend_origin: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
