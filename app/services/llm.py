import structlog
from typing import AsyncGenerator
from app.config import get_settings

logger = structlog.get_logger()


async def stream_completion(
    system_prompt: str,
    user_message: str,
) -> AsyncGenerator[str, None]:
    """Stream text from Groq (primary) with Gemini fallback.

    Yields text chunks as they arrive from the LLM.
    """
    settings = get_settings()

    # --- Try Groq first ---
    if settings.groq_api_key:
        try:
            async for chunk in _stream_groq(settings, system_prompt, user_message):
                yield chunk
            return
        except Exception as e:
            logger.warning("groq_fallback_triggered", error=str(e))

    # --- Fallback to Gemini ---
    if settings.gemini_api_key:
        try:
            async for chunk in _stream_gemini(settings, system_prompt, user_message):
                yield chunk
            return
        except Exception as e:
            logger.error("gemini_failed", error=str(e))
            raise RuntimeError(f"All LLM providers failed. Groq unavailable, Gemini error: {e}")

    raise RuntimeError("No LLM provider configured. Set GROQ_API_KEY or GEMINI_API_KEY.")


async def _stream_groq(
    settings,
    system_prompt: str,
    user_message: str,
) -> AsyncGenerator[str, None]:
    """Stream from Groq API using the official SDK."""
    from groq import AsyncGroq

    client = AsyncGroq(api_key=settings.groq_api_key)

    stream = await client.chat.completions.create(
        model=settings.groq_model,
        max_tokens=settings.groq_max_tokens,
        temperature=0.7,
        stream=True,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
    )

    async for chunk in stream:
        if chunk.choices and chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content

    logger.info("groq_stream_complete", model=settings.groq_model)


async def _stream_gemini(
    settings,
    system_prompt: str,
    user_message: str,
) -> AsyncGenerator[str, None]:
    """Stream from Gemini API using the google-genai SDK."""
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=settings.gemini_api_key)

    response = client.models.generate_content_stream(
        model=settings.gemini_model,
        contents=user_message,
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            max_output_tokens=settings.gemini_max_tokens,
            temperature=0.7,
        ),
    )

    for chunk in response:
        if chunk.text:
            yield chunk.text

    logger.info("gemini_stream_complete", model=settings.gemini_model)
