from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    groq_api_key: str = ""
    gemini_api_key: str = ""
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    supabase_anon_key: str = ""
    supabase_jwks_url: str = ""
    jwt_secret: str = ""
    redis_url: str = "redis://localhost:6379"
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]
    max_concurrent_generations: int = 3
    groq_model: str = "llama-3.3-70b-versatile"
    groq_max_tokens: int = 1024
    gemini_model: str = "gemini-2.0-flash"
    gemini_max_tokens: int = 1024
    demo_mode: bool = False

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
