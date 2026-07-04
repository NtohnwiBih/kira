from fastapi import HTTPException

class GatewayException(Exception):
    status_code: int = 500
    error_code:  str = "GATEWAY_ERROR"

    def __init__(self, message: str = "An internal error occurred.") -> None:
        super().__init__(message)
        self.message = message

    def to_http(self) -> HTTPException:
        return HTTPException(
            status_code=self.status_code,
            detail={"error": self.error_code, "message": self.message},
        )

class SafetyViolationException(GatewayException):
    status_code = 400; error_code = "SAFETY_VIOLATION"
class UnsupportedContentTypeException(GatewayException):
    status_code = 415; error_code = "UNSUPPORTED_MEDIA_TYPE"
class ValidationException(GatewayException):
    status_code = 422; error_code = "VALIDATION_ERROR"
class ForbiddenException(GatewayException):
    status_code = 403; error_code = "FORBIDDEN"
class RateLimitException(GatewayException):
    status_code = 429; error_code = "RATE_LIMIT_EXCEEDED"
class BackendUnavailableException(GatewayException):
    status_code = 502; error_code = "BACKEND_UNAVAILABLE"
class OpenAIException(GatewayException):
    status_code = 502; error_code = "OPENAI_ERROR"
class CircuitOpenException(GatewayException):
    status_code = 503; error_code = "CIRCUIT_OPEN"
class ToolExecutionException(GatewayException):
    status_code = 502; error_code = "TOOL_EXECUTION_FAILED"
class TimeoutException(GatewayException):
    status_code = 504; error_code = "REQUEST_TIMEOUT"
