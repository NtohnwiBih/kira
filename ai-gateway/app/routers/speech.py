from fastapi import APIRouter, Depends, Request, UploadFile, File, HTTPException
from fastapi.responses import Response
from openai import AsyncOpenAI

from app.core.openai_client      import get_openai_client
from app.core.security           import verify_service_key
from app.services.speech_service import SpeechService
from app.schemas.all_schemas     import (
    SynthesisRequest,
    TranscriptionResponse,
    ACCEPTED_AUDIO_TYPES,
)

router = APIRouter(
    prefix="/speech",
    tags=["Speech"],
    dependencies=[Depends(verify_service_key)],
)

MAX_AUDIO_BYTES = 25 * 1024 * 1024  # 25 MB hard limit


@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe(
    request:       Request,
    file:          UploadFile        = File(..., description="Audio file: wav, mp3, or m4a"),
    openai_client: AsyncOpenAI       = Depends(get_openai_client),
) -> TranscriptionResponse:
    """
    Converts speech audio to text using OpenAI Whisper.

    Accepted formats: `audio/wav`, `audio/mp3`, `audio/m4a`
    Max file size: 25 MB

    Returns the transcribed text for NestJS to pipe into /recommendations or /chat.

    **Note:** Speech endpoints are not supported with Ollama.
    Use `ai_provider=openai` for transcription and synthesis.
    """
    content_type = file.content_type or ""
    if content_type not in ACCEPTED_AUDIO_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported media type '{content_type}'. Accepted: {list(ACCEPTED_AUDIO_TYPES)}",
        )

    audio_bytes = await file.read()
    if len(audio_bytes) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="Audio file exceeds 25 MB limit.")

    service = SpeechService(openai_client)
    result  = await service.transcribe(
        audio_bytes  = audio_bytes,
        content_type = content_type,
        request_id   = getattr(request.state, "request_id", ""),
        user_id      = request.headers.get("X-User-Id", ""),
    )
    return TranscriptionResponse(**result)


@router.post("/synthesize", response_class=Response)
async def synthesize(
    payload:       SynthesisRequest,
    request:       Request,
    openai_client: AsyncOpenAI = Depends(get_openai_client),
) -> Response:
    """
    Converts text to speech using OpenAI TTS.

    Returns raw MP3 audio bytes — NestJS streams this back to the frontend.

    Typical use: read order confirmation or support answer aloud.
    Max input length: 4096 characters.

    **Note:** Speech endpoints are not supported with Ollama.
    """
    service     = SpeechService(openai_client)
    audio_bytes = await service.synthesize(
        text       = payload.text,
        request_id = getattr(request.state, "request_id", ""),
        user_id    = request.headers.get("X-User-Id", ""),
    )
    return Response(
        content      = audio_bytes,
        media_type   = "audio/mpeg",
        headers      = {"Content-Disposition": "inline; filename=response.mp3"},
    )