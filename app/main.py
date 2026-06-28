import structlog
import httpx
from fastapi import FastAPI, Request
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

# Trusted origin patterns — supports exact matches and suffix wildcards (e.g. .vercel.app)
ALLOWED_ORIGIN_PATTERNS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    ".vercel.app",
    ".onrender.com",
] + settings.cors_origins


def _is_origin_allowed(origin: str) -> bool:
    """Check if the request origin matches any allowed origin or suffix pattern."""
    for pattern in ALLOWED_ORIGIN_PATTERNS:
        if pattern.startswith("."):
            # Wildcard suffix match — e.g. ".vercel.app" matches any *.vercel.app
            if origin.endswith(pattern) or origin == pattern[1:]:
                return True
        else:
            if origin == pattern:
                return True
    return False


@app.middleware("http")
async def cors_middleware(request: Request, call_next):
    origin = request.headers.get("origin", "")
    allowed = _is_origin_allowed(origin)

    # Handle preflight OPTIONS request
    if request.method == "OPTIONS":
        headers = {
            "Access-Control-Allow-Origin": origin if allowed else "",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
            "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept, Origin, X-Requested-With",
            "Access-Control-Max-Age": "600",
        }
        return JSONResponse(status_code=200, content={}, headers=headers)

    response = await call_next(request)

    if allowed and origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, Accept, Origin, X-Requested-With"

    return response


@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    if request.method == "OPTIONS":
        return await call_next(request)

    if request.url.path in ("/docs", "/openapi.json", "/redoc", "/health"):
        return await call_next(request)

    # Demo mode: skip auth entirely, assign a fixed demo user
    if settings.demo_mode:
        request.state.user_id = "demo-user-000"
        return await call_next(request)

    # Stream endpoint handles its own auth via token query param
    # (EventSource cannot send custom headers)
    if request.url.path.startswith("/api/stream/"):
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
