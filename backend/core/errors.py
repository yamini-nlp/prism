import logging
from typing import Optional

from fastapi import FastAPI, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import HTTPException, RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from slowapi.errors import RateLimitExceeded

logger = logging.getLogger("prism")


class ErrorDetail(BaseModel):
    code: str
    message: str
    request_id: str
    details: Optional[dict] = None


class ErrorEnvelope(BaseModel):
    error: ErrorDetail


class AppError(Exception):
    status_code: int = status.HTTP_400_BAD_REQUEST
    code: str = "bad_request"

    def __init__(self, message: str, details: Optional[dict] = None, code: Optional[str] = None, status_code: Optional[int] = None):
        super().__init__(message)
        self.message = message
        self.details = details
        if code is not None:
            self.code = code
        if status_code is not None:
            self.status_code = status_code


class ValidationAppError(AppError):
    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    code = "validation_error"


class NotFoundError(AppError):
    status_code = status.HTTP_404_NOT_FOUND
    code = "not_found"


class UnauthorizedError(AppError):
    status_code = status.HTTP_401_UNAUTHORIZED
    code = "unauthorized"


class ForbiddenError(AppError):
    status_code = status.HTTP_403_FORBIDDEN
    code = "forbidden"


class ConflictError(AppError):
    status_code = status.HTTP_409_CONFLICT
    code = "conflict"


class RateLimitError(AppError):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    code = "rate_limited"


def _get_request_id(request: Request) -> str:
    return getattr(request.state, "request_id", "unknown")


def _envelope(code: str, message: str, request_id: str, details: Optional[dict] = None) -> dict:
    return {
        "error": {
            "code": code,
            "message": message,
            "request_id": request_id,
            "details": details,
        }
    }


async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    request_id = _get_request_id(request)
    return JSONResponse(
        status_code=exc.status_code,
        content=_envelope(exc.code, exc.message, request_id, exc.details),
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    request_id = _get_request_id(request)
    detail = exc.detail
    if isinstance(detail, dict):
        message = str(detail.get("message", detail))
        details = detail
    else:
        message = str(detail)
        details = None
    return JSONResponse(
        status_code=exc.status_code,
        content=_envelope("http_error", message, request_id, details),
        headers=getattr(exc, "headers", None),
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    request_id = _get_request_id(request)
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=_envelope("validation_error", "Request validation failed.", request_id, {"errors": jsonable_encoder(exc.errors())}),
    )


async def rate_limit_exception_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    request_id = _get_request_id(request)
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content=_envelope("rate_limited", str(exc.detail) if exc.detail else "Rate limit exceeded.", request_id, None),
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    request_id = _get_request_id(request)
    logger.error("unhandled exception", extra={"request_id": request_id}, exc_info=exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=_envelope("internal_error", "An unexpected error occurred.", request_id, None),
    )


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(AppError, app_error_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(RateLimitExceeded, rate_limit_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)
