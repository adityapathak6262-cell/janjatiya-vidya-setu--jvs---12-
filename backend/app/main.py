from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.api import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="Policy-to-Workflow Intelligence Platform for Ministry of Tribal Affairs (MoTA) Scholarships & Fellowships",
    version="1.0.0",
)

# Set CORS
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "HEALTHY",
        "service": "Janjatiya Vidya Setu (JVS) Backend",
        "version": "1.0.0",
        "database": "PostgreSQL 16 Async",
    }

@app.get("/ready", tags=["Health"])
async def readiness_check():
    return {"status": "READY", "ready": True}
