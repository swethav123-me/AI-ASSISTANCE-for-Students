from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db, close_db
from app.core.logging import setup_logging, logger
from app.core.exceptions import AppException
from app.routers.auth import router as auth_router
from app.routers.agents import router as agents_router
from app.routers.documents import router as documents_router
from app.routers.analytics import router as analytics_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")

    if settings.LLM_PROVIDER == "groq" and settings.GROQ_API_KEY:
        logger.info(f"Using Groq cloud API with model '{settings.GROQ_MODEL}'")
    else:
        try:
            import ollama
            models = ollama.list()
            available = [m.model for m in models.get("models", [])]
            if settings.OLLAMA_MODEL not in available and not any(
                m.startswith(settings.OLLAMA_MODEL) for m in available
            ):
                logger.warning(
                    f"Model '{settings.OLLAMA_MODEL}' not found. "
                    f"Available: {available}. "
                    f"Pull it with: ollama pull {settings.OLLAMA_MODEL}"
                )
            else:
                logger.info(f"Ollama model '{settings.OLLAMA_MODEL}' verified")
        except Exception as e:
            logger.warning(f"Ollama not available: {e}. Set LLM_PROVIDER=groq and GROQ_API_KEY for cloud.")

    await init_db()
    yield
    await close_db()
    logger.info("Application shutdown complete")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Multi-Agent AI Academic Assistant with RAG capabilities",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(AppException)
async def app_exception_handler(request, exc: AppException):
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message, "error_code": exc.error_code},
    )

app.include_router(auth_router)
app.include_router(agents_router)
app.include_router(documents_router)
app.include_router(analytics_router)

@app.get("/")
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "environment": settings.ENVIRONMENT,
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}