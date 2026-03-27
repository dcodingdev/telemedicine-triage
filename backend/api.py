from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
import schemas
from database import get_db
from auth import (
    get_password_hash, 
    verify_password, 
    create_access_token, 
    get_current_user,
    require_role
)
from bson import ObjectId
from datetime import datetime
import os

router = APIRouter()

# --- Auth Endpoints ---

@router.post("/auth/register", response_model=schemas.Token, status_code=status.HTTP_201_CREATED)
async def register(user_in: schemas.UserRegister, db=Depends(get_db)):
    # Check if user exists
    existing_user = await db["users"].find_one({"email": user_in.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_dict = user_in.model_dump()
    user_dict["hashed_password"] = get_password_hash(user_dict.pop("password"))
    user_dict["role"] = schemas.UserRole.USER
    
    result = await db["users"].insert_one(user_dict)
    user_dict["id"] = str(result.inserted_id)
    
    access_token = create_access_token(data={"sub": user_dict["id"], "role": user_dict["role"]})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": schemas.UserResponse(**user_dict)
    }

@router.post("/auth/login", response_model=schemas.Token)
async def login(user_in: schemas.UserLogin, db=Depends(get_db)):
    user_doc = await db["users"].find_one({"email": user_in.email})
    if not user_doc or not verify_password(user_in.password, user_doc["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    user_data = dict(user_doc)
    user_data["id"] = str(user_data["_id"])
    access_token = create_access_token(data={"sub": user_data["id"], "role": user_data["role"]})
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": schemas.UserResponse(**user_data)
    }

# --- Patient Endpoints ---

@router.post("/patients", response_model=schemas.PatientResponse)
async def create_patient(
    patient_in: schemas.PatientCreate, 
    current_user: schemas.UserResponse = Depends(get_current_user),
    db=Depends(get_db)
):
    patient_dict = patient_in.model_dump()
    patient_dict["user_id"] = current_user.id
    patient_dict["created_at"] = datetime.utcnow()
    # Handle date of birth conversion for BSON if needed, but motor/pydantic usually handle it
    
    result = await db["patients"].insert_one(patient_dict)
    patient_dict["id"] = str(result.inserted_id)
    return schemas.PatientResponse(**patient_dict)

@router.get("/patients", response_model=List[schemas.PatientResponse])
async def list_patients(
    current_user: schemas.UserResponse = Depends(get_current_user),
    db=Depends(get_db)
):
    cursor = db["patients"].find({"user_id": current_user.id})
    patients_list = []
    async for doc in cursor:
        doc_dict = dict(doc)
        doc_dict["id"] = str(doc_dict["_id"])
        patients_list.append(schemas.PatientResponse(**doc_dict))
    return patients_list

# --- Triage/Survey Endpoints ---

@router.post("/surveys", response_model=schemas.TriageResult)
async def submit_survey(
    survey_in: schemas.TriageRequest,
    current_user: schemas.UserResponse = Depends(get_current_user),
    db=Depends(get_db)
):
    # Verify patient belongs to user
    patient_doc = await db["patients"].find_one({"_id": ObjectId(survey_in.patient_id), "user_id": current_user.id})
    if not patient_doc:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Mock Triage Analysis
    emergency_level = schemas.EmergencyLevel.LOW
    complaint = survey_in.chief_complaint.lower()
    
    if any(word in complaint for word in ["chest pain", "breathing", "unconscious"]):
        emergency_level = schemas.EmergencyLevel.CRITICAL
    elif any(word in complaint for word in ["fever", "pain", "bleeding"]):
        emergency_level = schemas.EmergencyLevel.HIGH
        
    result_dict = {
        "patient_id": survey_in.patient_id,
        "emergency_level": emergency_level,
        "suggested_action": "Consult a doctor immediately" if emergency_level in [schemas.EmergencyLevel.CRITICAL, schemas.EmergencyLevel.HIGH] else "Monitor symptoms",
        "summary": f"Triage assessment for {patient_doc['first_name']} based on chief complaint: {survey_in.chief_complaint[:50]}...",
        "created_at": datetime.utcnow()
    }
    
    # Save survey data
    survey_data = survey_in.model_dump()
    survey_data["created_at"] = datetime.utcnow()
    await db["surveys"].insert_one(survey_data)
    
    # Save result
    res = await db["triage_results"].insert_one(result_dict)
    result_dict["id"] = str(res.inserted_id)
    
    return schemas.TriageResult(**result_dict)

@router.get("/health/")
def health_check():
    return {"status": "healthy"}
