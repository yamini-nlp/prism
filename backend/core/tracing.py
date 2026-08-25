import logging
from urllib.parse import urlparse

from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

from core.config import settings

logger = logging.getLogger("prism")

_tracing_initialized = False

_LOCALHOST_HOSTS = {"localhost", "127.0.0.1", "::1", "0.0.0.0"}


def _points_at_localhost(endpoint: str) -> bool:
    host = urlparse(endpoint).hostname
    return host in _LOCALHOST_HOSTS if host else False


def setup_tracing(app) -> None:
    global _tracing_initialized
    if _tracing_initialized or not settings.otel_traces_enabled:
        return

    if not settings.is_development and _points_at_localhost(settings.otel_exporter_otlp_endpoint):
        logger.warning(
            "tracing disabled: OTEL_EXPORTER_OTLP_ENDPOINT points at localhost with no collector reachable in this "
            "environment; exporting would queue spans indefinitely and grow unbounded memory"
        )
        return

    try:
        resource = Resource.create({
            "service.name": settings.otel_service_name,
            "deployment.environment": settings.environment,
        })

        provider = TracerProvider(resource=resource)
        exporter = OTLPSpanExporter(
            endpoint=settings.otel_exporter_otlp_endpoint,
            insecure=settings.otel_exporter_otlp_insecure,
        )
        provider.add_span_processor(BatchSpanProcessor(exporter))
        trace.set_tracer_provider(provider)

        FastAPIInstrumentor.instrument_app(app)
        HTTPXClientInstrumentor().instrument()

        _tracing_initialized = True
    except Exception as exc:
        logger.warning("tracing setup failed", extra={"error": str(exc)})
