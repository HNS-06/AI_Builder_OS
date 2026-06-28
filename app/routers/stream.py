import asyncio
import json
import structlog
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse, JSONResponse
from app.services.supabase import get_project
from app.services.streaming import register_client, unregister_client
from app.config import get_settings
import httpx
from jose import jwt, JWTError

logger = structlog.get_logger()
router = APIRouter(prefix="/api", tags=["stream"])

_jwks_cache: dict = None


async def _fetch_jwks() -> dict:
    global _jwks_cache
    if _jwks_cache is None:
        settings = get_settings()
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


async def _validate_token(token: str) -> str | None:
    """Validate a JWT token and return the user_id (sub), or None on failure."""
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
        return payload.get("sub")
    except (JWTError, Exception) as e:
        logger.warning("stream_token_validation_failed", error=str(e))
        return None


@router.get("/stream/{project_id}")
async def stream_project(project_id: str, request: Request, token: str | None = None):
    # Support auth via query param (EventSource cannot send custom headers)
    user_id = getattr(request.state, "user_id", None)

    if user_id is None and token:
        user_id = await _validate_token(token)

    if user_id is None and get_settings().demo_mode:
        user_id = "demo-user-000"

    if user_id is None:
        return JSONResponse(
            status_code=401,
            content={"detail": "Authentication required. Provide a valid Bearer token or token query param."},
        )

    project = await get_project(project_id, user_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    queue = register_client(project_id)

    async def event_generator():
        try:
            while True:
                if await request.is_disconnected():
                    break

                if not queue.empty():
                    data = await queue.get()
                    yield data

                    parsed = json.loads(data.split("data: ", 1)[1].split("\n\n")[0])
                    # investor is the final agent in the pipeline — close stream when it finishes
                    if parsed.get("done") and parsed.get("agent") == "investor":
                        break
                else:
                    await asyncio.sleep(0.3)

        except asyncio.CancelledError:
            pass
        finally:
            unregister_client(project_id, queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
