from pydantic import BaseModel, Field

ACCEPTED_AUDIO_TYPES = frozenset({
    "audio/wav", "audio/mpeg", "audio/mp3",
    "audio/m4a", "audio/x-m4a", "audio/webm",
})


class TranscriptionResponse(BaseModel):
    text:        str
    language:    str | None = None
    request_id:  str
    model_used:  str
    duration_ms: float | None = None


class SynthesisRequest(BaseModel):
    text:  str   = Field(..., min_length=1, max_length=4096)
    voice: str | None = None


class VoicePipelineResponse(BaseModel):
    transcription:    str
    detected_language: str
    intent:           str | None = None
    reply_text:       str
    audio_b64:        str | None = None  # base64-encoded MP3
    tools_used:       list[str] = Field(default_factory=list)
    request_id:       str
    model_used:       str
    tts_model:        str