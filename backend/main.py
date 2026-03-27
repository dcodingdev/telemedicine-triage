from fastapi import FastAPI # type: ignore
from api import router as api_router # type: ignore

app = FastAPI(title="Telemedicine Triage")

# Include the API router
app.include_router(api_router, prefix="/api", tags=["triage"])

@app.get("/")
def read_root():
    return {"message": "Welcome to Telemedicine Triage API"}
