from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import router as api_router
from voice import router as voice_router
from database import connect_db, close_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    await connect_db()
    yield
    # Shutdown actions
    await close_db()

app = FastAPI(title="Telemedicine Triage", lifespan=lifespan)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"], # Update in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers
app.include_router(api_router, prefix="/api", tags=["triage"])
app.include_router(voice_router, prefix="/api", tags=["voice"])


@app.get("/")
def read_root():
    return {"message": "Welcome to Telemedicine Triage API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="localhost", port=8000, reload=True)
