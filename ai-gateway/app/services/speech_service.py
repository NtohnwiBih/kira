import io
from openai       import AsyncOpenAI
from fastapi      import UploadFile, HTTPException, status

from app.core.config  import settings
from app.utils.logger import logger, RequestTimer, generate_request_id
from app.schemas      import TranscriptionResponse

ACCEPTED_AUDIO_TYPES = {"audio/wav", "audio/mp3", "audio/mpeg", "audio/m4a", "audio/x-m4a"}
MAX_AUDIO_BYTES      = 25 * 1024 * 1024   


class SpeechService:
    def __init__(self, client: AsyncOpenAI):
        self.client = client

    # ── Transcription ─────────────────────────────────────────────────────────

    async def transcribe(self, user_id: str, file: UploadFile) -> TranscriptionResponse:
        request_id = generate_request_id()

        # ── Validate content type ────────────────────────────────────────────
        if file.content_type not in ACCEPTED_AUDIO_TYPES:
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail=f"Unsupported audio type '{file.content_type}'. "
                       f"Accepted: wav, mp3, m4a",
            )

        audio_bytes = await file.read()

        if len(audio_bytes) > MAX_AUDIO_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Audio file exceeds the 25 MB limit.",
            )

        with RequestTimer() as timer:
            audio_file = io.BytesIO(audio_bytes)
            audio_file.name = file.filename or "audio.wav"

            response = await self.client.audio.transcriptions.create(
                model=settings.OPENAI_WHISPER_MODEL,
                file=audio_file,
                response_format="text",
            )
            text = response if isinstance(response, str) else response.text

        logger.info(
            "transcription_request",
            request_id=request_id,
            user_id=user_id,
            filename=file.filename,
            audio_bytes=len(audio_bytes),
            latency_ms=timer.elapsed_ms,
            model=settings.OPENAI_WHISPER_MODEL,
        )

        return TranscriptionResponse(
            text=text,
            request_id=request_id,
            model=settings.OPENAI_WHISPER_MODEL,
        )

    # ── Synthesis ─────────────────────────────────────────────────────────────

    async def synthesize(self, user_id: str, text: str) -> bytes:
        """
        Returns raw audio bytes (MP3).
        The router streams these directly back to NestJS.
        """
        request_id = generate_request_id()

        if len(text) > 4096:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Text exceeds the 4096-character TTS limit.",
            )

        with RequestTimer() as timer:
            response = await self.client.audio.speech.create(
                model=settings.OPENAI_TTS_MODEL,
                voice=settings.OPENAI_TTS_VOICE,
                input=text,
                response_format="mp3",
            )
            audio_bytes = response.content

        logger.info(
            "synthesis_request",
            request_id=request_id,
            user_id=user_id,
            char_count=len(text),
            audio_bytes=len(audio_bytes),
            latency_ms=timer.elapsed_ms,
            model=settings.OPENAI_TTS_MODEL,
            voice=settings.OPENAI_TTS_VOICE,
        )

        return audio_bytes