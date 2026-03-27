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


# --- Specialist Table ---

SPECIALIST_TABLE = {
    "sp_1": {"name": "General Practitioner", "keywords": ["general", "checkup", "fatigue", "cold", "flu", "weakness"]},
    "sp_2": {"name": "Cardiologist", "keywords": ["chest pain", "heart", "palpitations", "hypertension", "cardiac", "blood pressure"]},
    "sp_3": {"name": "Pulmonologist", "keywords": ["breathing", "cough", "asthma", "copd", "lung", "shortness of breath", "wheezing"]},
    "sp_4": {"name": "Neurologist", "keywords": ["headache", "seizure", "numbness", "dizziness", "stroke", "tingling", "migraine"]},
    "sp_5": {"name": "Gastroenterologist", "keywords": ["abdominal", "nausea", "vomiting", "stomach", "diarrhea", "indigestion", "acid reflux"]},
    "sp_6": {"name": "Orthopedist", "keywords": ["fracture", "bone", "joint", "sprain", "muscle", "back pain", "knee"]},
    "sp_7": {"name": "Psychiatrist", "keywords": ["anxiety", "depression", "suicidal", "mental health", "insomnia", "panic"]},
    "sp_8": {"name": "Allergist", "keywords": ["allergy", "anaphylaxis", "hives", "swelling", "allergic reaction"]},
    "sp_9": {"name": "Dermatologist", "keywords": ["skin", "rash", "lesion", "eczema", "acne", "mole", "itching"]},
    "sp_10": {"name": "Pediatrician", "keywords": ["child", "infant", "pediatric", "baby", "toddler"]},
    "sp_11": {"name": "OB/GYN", "keywords": ["pregnancy", "menstrual", "gynecological", "prenatal", "reproductive"]},
    "sp_12": {"name": "ENT Specialist", "keywords": ["ear", "nose", "throat", "sinus", "hearing", "tonsil"]},
}


# --- Agentic Triage Schemas (Phase 3) ---

class TriageLevel(str, Enum):
    EMERGENCY_AMBULANCE = "emergency_ambulance"
    EMERGENCY = "emergency"
    CONSULTATION_24 = "consultation_24"
    CONSULTATION_72 = "consultation_72"
    SELF_CARE = "self_care"


class TriageObject(BaseModel):
    """
    The strict output contract for the CrewAI dual-agent triage crew.
    Both agents debate over the patient data to produce this validated object.
    """
    level: TriageLevel
    specialist_id: str          # e.g. "sp_9"  or "NONE" for emergency_ambulance
    specialist_name: str        # e.g. "Dermatologist" or "Emergency Services (911)"
    summary: str                # Clinical summary for patient
    red_flags: List[str]        # Identified red flags
    reasoning_path: str         # Chain-of-thought explanation for the doctor


class TriageRunRequest(BaseModel):
    """Request payload for triggering the agentic triage crew."""
    patient_id: str
    chief_complaint: str
    demographics: Optional[Demographics] = None
    medical_baseline: Optional[MedicalHistory] = None
    risk_profile: Optional[RiskProfile] = None
    transcript: Optional[str] = None    # Voice session transcript
    rag_context: Optional[str] = None   # Pre-fetched RAG snippets


class TriageTaskStatus(BaseModel):
    """Polling response for async triage background task."""
    task_id: str
    status: str                 # "pending", "running", "completed", "failed"
    result: Optional[TriageObject] = None
    error: Optional[str] = None
