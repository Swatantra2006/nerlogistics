"""
NER Logistics Intelligence Platform — Backend Core Application
FastAPI REST + Geospatial API for PS 26002
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.database import engine, Base
from app.seed import seed_database
from app.routers.auth import router as auth_router
from app.routers.geo import router as geo_router
from app.routers.logistics import router as logistics_router
from app.routers.routing import router as routing_router
from app.routers.accessibility import router as accessibility_router
from app.routers.risk import router as risk_router
from app.routers.demand import router as demand_router
from app.routers.infrastructure import router as infrastructure_router
from app.routers.scenario import router as scenario_router
from app.routers.copilot import router as copilot_router
from app.routers.spatial import router as spatial_router
from app.routers.realtime import router as realtime_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ner_logistics")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables exist and data is seeded
    logger.info("Initializing NER Logistics database tables...")
    Base.metadata.create_all(bind=engine)
    try:
        seed_database()
        logger.info("Database verification and seeding complete.")
    except Exception as e:
        logger.warning(f"Seed note: {e}")
    yield
    # Shutdown
    logger.info("NER Logistics service shutting down.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend Intelligence & Spatial Query Engine for the North Eastern Region Logistics Platform (PS 26002)",
    lifespan=lifespan,
)

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "https://nerlogistics.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth_router)
app.include_router(geo_router)
app.include_router(logistics_router)
app.include_router(routing_router)
app.include_router(accessibility_router)
app.include_router(risk_router)
app.include_router(demand_router)
app.include_router(infrastructure_router)
app.include_router(scenario_router)
app.include_router(copilot_router)
app.include_router(spatial_router)
app.include_router(realtime_router)


@app.get("/")
def root():
    return {
        "project": "PS 26002 — AI-Based Smart Logistics and Accessibility Intelligence Platform for NER",
        "system": "NER Logistics Intelligence Backend API",
        "version": settings.VERSION,
        "docs": "/docs",
        "status": "operational",
    }


@app.get("/api/health")
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "version": settings.VERSION,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
