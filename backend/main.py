from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import router as api_router
from voice import router as voice_router
from database import connect_db, close_db

app = FastAPI(title="Telemedicine Triage")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    await connect_db()

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_db()

# Include routers
app.include_router(api_router, prefix="/api", tags=["triage"])
app.include_router(voice_router, prefix="/api", tags=["voice"])


@app.get("/")
def read_root():
    return {"message": "Welcome to Telemedicine Triage API"}
