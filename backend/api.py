from fastapi import APIRouter, HTTPException # type: ignore

from typing import List
import schemas # type: ignore



router = APIRouter()

# In-memory storage for demonstration
patients = {}

@router.post("/triage/", response_model=schemas.TriageResult)

def create_triage_request(request: schemas.TriageRequest):
    # Logic for triage analysis (mocked)
    emergency_level = schemas.EmergencyLevel.LOW
    
    if "chest pain" in " ".join(request.symptoms).lower():
        emergency_level = schemas.EmergencyLevel.CRITICAL
    elif "fever" in " ".join(request.symptoms).lower() and request.level_of_pain > 5:
        emergency_level = schemas.EmergencyLevel.HIGH
        
    result = schemas.TriageResult(
        request_id="TR-12345",
        emergency_level=emergency_level,
        suggested_action="Consult a doctor immediately" if emergency_level in [schemas.EmergencyLevel.CRITICAL, schemas.EmergencyLevel.HIGH] else "Monitor symptoms",
        summary=f"Analysis of symptoms {', '.join(request.symptoms)} shows {emergency_level.value} risk."
    )
    return result

@router.get("/health/")
def health_check():
    return {"status": "healthy"}
