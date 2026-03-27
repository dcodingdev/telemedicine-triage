from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from enum import Enum
from datetime import date, datetime

# --- Auth Schemas ---

class UserRole(str, Enum):
    USER = "user"
    PATIENT = "patient"
    ADMIN = "admin"

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    first_name: str
    last_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    first_name: str
    last_name: str
    role: UserRole

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# --- Medical Intake Schemas ---

class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"

class EmergencyLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class MedicalHistory(BaseModel):
    chronic_conditions: List[str] = []
    allergies: List[str] = []
    current_medications: List[str] = []

class Demographics(BaseModel):
    age: int = Field(..., ge=0, le=120)
    sex_at_birth: Gender
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None

class RiskProfile(BaseModel):
    smoker: bool = False
    alcohol_use: str = "none" # none, occasional, frequent
    pregnancy_status: bool = False

class PatientCreate(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: date
    is_proxy: bool = False
    relation: str = "self" # self, child, parent, other
    history: MedicalHistory

class PatientResponse(PatientCreate):
    id: str
    user_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class TriageRequest(BaseModel):
    patient_id: str
    demographics: Demographics
    medical_baseline: MedicalHistory
    risk_profile: RiskProfile
    chief_complaint: str = Field(..., max_length=2000)
    symptom_onset: Optional[date] = None

class TriageResult(BaseModel):
    id: str
    patient_id: str
    emergency_level: EmergencyLevel
    suggested_action: str
    summary: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Voice Session Schemas ---

class VoiceTokenRequest(BaseModel):
    patient_id: str
    survey_id: Optional[str] = None

class VoiceTokenResponse(BaseModel):
    token: str
    room_name: str
    livekit_url: str

class VoiceSessionComplete(BaseModel):
    room_name: str
    transcript: str
    patient_id: str

class RAGSnippet(BaseModel):
    text: str
    source: str = "medical_reference"
    relevance_score: float = 0.0

class RAGResult(BaseModel):
    context_snippets: List[RAGSnippet] = []
    enriched_summary: str = ""
    medical_references: List[str] = []

class EnrichedTriageResult(BaseModel):
    id: str
    patient_id: str
    emergency_level: EmergencyLevel
    suggested_action: str
    summary: str
    transcript: str = ""
    rag_context: Optional[RAGResult] = None
    created_at: datetime

    class Config:
        from_attributes = True
