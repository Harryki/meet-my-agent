from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "meet-my-agent"
    debug: bool = False

    database_url: str = "sqlite+aiosqlite:///./db.sqlite3"

    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 15
    jwt_refresh_token_expire_days: int = 7

    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:5173/auth/callback"

    redis_url: str = "redis://localhost:6379/0"

    openai_api_key: str = ""

    storage_local_base_path: str = "storage/files"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
