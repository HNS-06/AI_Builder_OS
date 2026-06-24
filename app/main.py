import structlog
import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from jose import jwt, JWTError
from jose.exceptions import JWKError
from app.config import get_settings
from app.routers import generate, project, stream

structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.add_log_level,
        structlog.processors.JSONRenderer(),
    ],
)
logger = structlog.get_logger()

settings = get_settings()

_jwks_cache: dict = None


async def _fetch_jwks() -> dict:
    global _jwks_cache
    if _jwks_cache is None:
        async with httpx.AsyncClient() as client:
            resp = await client.get(settings.supabase_jwks_url)
            resp.raise_for_status()
            _jwks_cache = resp.json()
    return _jwks_cache


def _get_signing_key(jwks: dict, token: str):
    from jose.utils import long_to_bytes
    unverified_header = jwt.get_unverified_header(token)
    kid = unverified_header.get("kid")
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return key
    raise JWTError("No matching key found")


app = FastAPI(
    title="AI Builder OS",
    description="Multi-agent AI system that generates complete startup packages",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    if request.url.path in ("/docs", "/openapi.json", "/redoc", "/health"):
        return await call_next(request)

    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return JSONResponse(status_code=401, content={"detail": "Missing or invalid Authorization header"})

    token = auth_header.split(" ", 1)[1]
    try:
        jwks = await _fetch_jwks()
        signing_key = _get_signing_key(jwks, token)
        payload = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            audience="authenticated",
            options={"verify_exp": True},
        )
        user_id = payload.get("sub")
        if not user_id:
            return JSONResponse(status_code=401, content={"detail": "Invalid token: missing sub"})
        request.state.user_id = user_id
    except JWTError as e:
        logger.warning("auth_failed", error=str(e))
        return JSONResponse(status_code=401, content={"detail": f"Invalid token: {e}"})

    response = await call_next(request)
    return response


app.include_router(generate.router)
app.include_router(project.router)
app.include_router(stream.router)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "ai-builder-os"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
