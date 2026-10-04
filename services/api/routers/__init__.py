"""Router package init."""

from services.api.routers.health import router as health_router
from services.api.routers.documents import router as documents_router
from services.api.routers.facts import router as facts_router
from services.api.routers.reports import router as reports_router
from services.api.routers.questions import router as questions_router

__all__ = [
    "documents_router",
    "facts_router",
    "health_router",
    "questions_router",
    "reports_router",
]
