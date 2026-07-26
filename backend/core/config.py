import os
from typing import List, Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

_DEFAULT_ALLOWED_ORIGINS = "http://localhost:3000,http://127.0.0.1:3000,https://prism-nine-tau.vercel.app"
_DEV_ENVIRONMENTS = {"development", "dev", "test", "testing", "local"}
_SECRET_ENV_VARS_REQUIRED_IN_PRODUCTION = [
    "GROQ_API_KEY",
    "JWT_SECRET_KEY",
    "DATABASE_URL",
    "REDIS_URL",
]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = Field(default="development", alias="ENVIRONMENT")
    groq_api_key: Optional[str] = Field(default=None, alias="GROQ_API_KEY")
    app_api_key: Optional[str] = Field(default=None, alias="APP_API_KEY")
    allowed_origins: str = Field(default=_DEFAULT_ALLOWED_ORIGINS, alias="ALLOWED_ORIGINS")
    database_url: str = Field(
        default="postgresql+asyncpg://prism:prism@localhost:5432/prism",
        alias="DATABASE_URL",
    )
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")
    jwt_secret_key: str = Field(default="dev-insecure-secret-change-me", alias="JWT_SECRET_KEY")
    jwt_access_token_expire_minutes: int = Field(default=30, alias="JWT_ACCESS_TOKEN_EXPIRE_MINUTES")
    jwt_refresh_token_expire_days: int = Field(default=30, alias="JWT_REFRESH_TOKEN_EXPIRE_DAYS")
    max_upload_size_bytes: int = Field(default=20 * 1024 * 1024, alias="MAX_UPLOAD_SIZE_BYTES")
    max_request_body_bytes: int = Field(default=25 * 1024 * 1024, alias="MAX_REQUEST_BODY_BYTES")
    request_timeout_seconds: float = Field(default=60.0, alias="REQUEST_TIMEOUT_SECONDS")
    otel_service_name: str = Field(default="prism-backend", alias="OTEL_SERVICE_NAME")
    otel_exporter_otlp_endpoint: str = Field(default="http://localhost:4317", alias="OTEL_EXPORTER_OTLP_ENDPOINT")
    otel_exporter_otlp_insecure: bool = Field(default=True, alias="OTEL_EXPORTER_OTLP_INSECURE")
    otel_traces_enabled: bool = Field(default=True, alias="OTEL_TRACES_ENABLED")

    @property
    def is_development(self) -> bool:
        return self.environment.lower() in _DEV_ENVIRONMENTS

    @property
    def allowed_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


def _fail_fast_on_missing_secrets(current_settings: "Settings") -> None:
    if current_settings.is_development:
        return
    missing = [name for name in _SECRET_ENV_VARS_REQUIRED_IN_PRODUCTION if not os.environ.get(name)]
    if missing:
        raise RuntimeError(
            "Missing required environment variables for environment "
            f"'{current_settings.environment}': {', '.join(missing)}"
        )


settings = Settings()
_fail_fast_on_missing_secrets(settings)