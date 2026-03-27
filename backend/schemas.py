from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from enum import Enum
from datetime import date

class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"

class EmergencyLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class PatientBase(BaseModel):
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    email: EmailStr
    date_of_birth: date
    gender: Gender

class TriageRequest(BaseModel):
    symptoms: List[str] = Field(..., min_items=1)
    description: str = Field(..., max_length=1000)
    history: Optional[str] = None
    level_of_pain: int = Field(0, ge=0, le=10)

class TriageResult(BaseModel):
    request_id: str
    emergency_level: EmergencyLevel
    suggested_action: str
    summary: str

class PatientCreate(PatientBase):
    pass

class Patient(PatientBase):
    id: str
    triage_history: List[TriageResult] = []

    class Config:
        from_attributes = True
