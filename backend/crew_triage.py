"""
Agentic Triage Module (Phase 3 — Clinical Failsafe)

Dual-agent CrewAI system where a Triage Optimizer drafts a clinical
assessment and a Clinical Evaluator audits it for missed red flags.

Output: A validated TriageObject with specialist routing.

Architecture:
  Agent A (Triage Optimizer)  — Gemini 1.5 Flash  — Drafts the triage
  Agent B (Clinical Evaluator) — Gemini 1.5 Pro   — Audits & finalizes
  Process: Sequential (A → B)
"""

import os
import json
import logging
import asyncio
from typing import Optional

from crewai import Agent, Task, Crew, Process, LLM
from dotenv import load_dotenv

import schemas
from schemas import TriageObject, SPECIALIST_TABLE

load_dotenv()

logger = logging.getLogger("crew-triage")

# --- LLM Configuration ---

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
OPTIMIZER_MODEL = os.getenv("CREWAI_OPTIMIZER_MODEL", "gemini/gemini-1.5-flash")
EVALUATOR_MODEL = os.getenv("CREWAI_EVALUATOR_MODEL", "gemini/gemini-1.5-pro")


def _build_specialist_context() -> str:
    """Format the specialist table as a readable reference for the Evaluator."""
    lines = ["SPECIALIST ROUTING TABLE:", "=" * 50]
    for sp_id, info in SPECIALIST_TABLE.items():
        keywords = ", ".join(info["keywords"])
        lines.append(f"  {sp_id}: {info['name']} — Keywords: {keywords}")
    lines.append("=" * 50)
    lines.append("")
    lines.append("CRITICAL RULE: If level is 'emergency_ambulance', set specialist_id='NONE' and specialist_name='Emergency Services (911)'.")
    lines.append("For all other levels, you MUST select a specialist from the table above based on keyword matching.")
    return "\n".join(lines)


# --- Agent Definitions ---

def _create_optimizer(llm: LLM) -> Agent:
    """Agent A: The Triage Optimizer — synthesizes patient data into a draft report."""
    return Agent(
        role="Medical Intake Specialist",
        goal=(
            "Synthesize the patient's survey data, voice transcript, and retrieved "
            "medical context into a thorough preliminary triage report. Identify all "
            "symptoms, potential risk factors, and relevant medical history."
        ),
        backstory=(
            "You are an expert at identifying clinical patterns from patient intake data. "
            "You have 15 years of experience in emergency triage. Your job is to be "
            "thorough and empathetic, ensuring ALL patient symptoms are accounted for. "
            "You never dismiss a symptom as irrelevant — context matters. A patient "
            "mentioning 'indigestion' with a history of heart disease is very different "
            "from a healthy young adult with the same complaint."
        ),
        llm=llm,
        verbose=True,
        allow_delegation=False,
    )


def _create_evaluator(llm: LLM) -> Agent:
    """Agent B: The Clinical Evaluator — audits the draft for safety."""
    specialist_context = _build_specialist_context()
    return Agent(
        role="Senior Emergency Physician",
        goal=(
            "Audit the Triage Optimizer's report. Specifically search for 'Red Flags' "
            "or potentially missed life-threatening conditions. Assign the correct "
            "urgency level and route the patient to the appropriate specialist. "
            "Your output MUST be a valid TriageObject JSON."
        ),
        backstory=(
            "You are a highly skeptical Senior Emergency Physician with 20 years of "
            "experience. You assume the worst-case scenario until it is ruled out. "
            "If a patient mentions 'indigestion' but has a 'history of heart disease,' "
            "you MUST escalate the urgency to 'emergency'. If there is ANY mention of "
            "chest pain, difficulty breathing, stroke symptoms, or severe bleeding, "
            "you escalate to 'emergency_ambulance'. You are the last line of defense "
            "before a patient receives care — you cannot afford to miss anything.\n\n"
            f"{specialist_context}"
        ),
        llm=llm,
        verbose=True,
        allow_delegation=False,
    )


# --- Task Definitions ---

def _create_optimization_task(agent: Agent, patient_data: str, rag_context: str) -> Task:
    """Task 1: Draft a preliminary triage from patient data + RAG context."""
    return Task(
        description=(
            "Analyze the following patient data and medical reference context to "
            "draft a preliminary triage report.\n\n"
            "PATIENT DATA:\n"
            f"{patient_data}\n\n"
            "MEDICAL REFERENCE CONTEXT (from RAG):\n"
            f"{rag_context}\n\n"
            "Your report must include:\n"
            "1. A clear summary of all identified symptoms\n"
            "2. Relevant risk factors from medical history\n"
            "3. Any 'red flags' that could indicate a life-threatening condition\n"
            "4. Your preliminary assessment of urgency\n"
            "5. Which type of specialist would be most appropriate\n\n"
            "Be thorough. Do not dismiss any symptom."
        ),
        expected_output=(
            "A detailed preliminary triage report covering symptoms, risk factors, "
            "red flags, urgency assessment, and specialist recommendation."
        ),
        agent=agent,
    )


def _create_evaluation_task(agent: Agent) -> Task:
    """Task 2: Audit the draft and produce a validated TriageObject."""
    return Task(
        description=(
            "You are reviewing the Triage Optimizer's preliminary report above.\n\n"
            "YOUR CRITICAL RESPONSIBILITIES:\n"
            "1. Search for ANY life-threatening symptoms that may have been under-triaged\n"
            "2. Cross-reference symptoms with the patient's medical history\n"
            "3. Apply the 'worst-case scenario' principle — if a symptom COULD indicate "
            "   a life-threatening condition, escalate urgency\n"
            "4. Assign the final triage level from EXACTLY one of: "
            "'emergency_ambulance', 'emergency', 'consultation_24', 'consultation_72', 'self_care'\n"
            "5. Select the correct specialist from the SPECIALIST ROUTING TABLE in your backstory\n"
            "6. SPECIAL RULE: If level is 'emergency_ambulance', specialist_id MUST be 'NONE' "
            "   and specialist_name MUST be 'Emergency Services (911)'\n\n"
            "ESCALATION TRIGGERS (override optimizer's assessment):\n"
            "- Chest pain + cardiac history → emergency or emergency_ambulance\n"
            "- Indigestion + heart disease history → emergency\n"
            "- Difficulty breathing + any risk factor → emergency\n"
            "- Severe headache + stroke symptoms → emergency_ambulance\n"
            "- Suicidal ideation with a plan → emergency_ambulance\n"
            "- Any symptom of anaphylaxis → emergency_ambulance\n\n"
            "Your FINAL output MUST be a valid JSON matching this exact schema:\n"
            "{\n"
            '  "level": "<triage_level>",\n'
            '  "specialist_id": "<sp_X or NONE>",\n'
            '  "specialist_name": "<Specialist Name>",\n'
            '  "summary": "<clinical summary for the patient>",\n'
            '  "red_flags": ["<flag1>", "<flag2>"],\n'
            '  "reasoning_path": "<explain WHY you chose this level and specialist>"\n'
            "}\n"
        ),
        expected_output=(
            "A validated TriageObject JSON with level, specialist_id, specialist_name, "
            "summary, red_flags list, and reasoning_path."
        ),
        output_pydantic=TriageObject,
        agent=agent,
    )


# --- Crew Orchestration ---

def _build_patient_data_string(request: schemas.TriageRunRequest) -> str:
    """Assemble a human-readable patient data string for the agents."""
    parts = [f"Chief Complaint: {request.chief_complaint}"]

    if request.demographics:
        d = request.demographics
        parts.append(f"Demographics: Age {d.age}, Sex: {d.sex_at_birth.value}")
        if d.height_cm:
            parts.append(f"  Height: {d.height_cm} cm")
        if d.weight_kg:
            parts.append(f"  Weight: {d.weight_kg} kg")

    if request.medical_baseline:
        mb = request.medical_baseline
        if mb.chronic_conditions:
            parts.append(f"Chronic Conditions: {', '.join(mb.chronic_conditions)}")
        if mb.allergies:
            parts.append(f"Allergies: {', '.join(mb.allergies)}")
        if mb.current_medications:
            parts.append(f"Current Medications: {', '.join(mb.current_medications)}")

    if request.risk_profile:
        rp = request.risk_profile
        risk_items = []
        if rp.smoker:
            risk_items.append("Smoker")
        if rp.alcohol_use != "none":
            risk_items.append(f"Alcohol: {rp.alcohol_use}")
        if rp.pregnancy_status:
            risk_items.append("Pregnant")
        if risk_items:
            parts.append(f"Risk Factors: {', '.join(risk_items)}")

    if request.transcript:
        parts.append(f"\nVoice Transcript:\n{request.transcript}")

    return "\n".join(parts)


def run_triage_crew(request: schemas.TriageRunRequest) -> TriageObject:
    """
    Execute the dual-agent triage crew synchronously.
    Called from within a background task — NOT from the async event loop directly.

    Returns a validated TriageObject.
    """
    logger.info(f"Starting triage crew for patient {request.patient_id}")

    # Build LLMs
    optimizer_llm = LLM(
        model=OPTIMIZER_MODEL,
        api_key=GOOGLE_API_KEY,
    )
    evaluator_llm = LLM(
        model=EVALUATOR_MODEL,
        api_key=GOOGLE_API_KEY,
    )

    # Create agents
    optimizer = _create_optimizer(optimizer_llm)
    evaluator = _create_evaluator(evaluator_llm)

    # Build context strings
    patient_data = _build_patient_data_string(request)
    rag_context = request.rag_context or "No medical reference context available."

    # Create tasks
    opt_task = _create_optimization_task(optimizer, patient_data, rag_context)
    eval_task = _create_evaluation_task(evaluator)

    # Assemble and run the crew
    crew = Crew(
        agents=[optimizer, evaluator],
        tasks=[opt_task, eval_task],
        process=Process.sequential,
        verbose=True,
    )

    logger.info("Kicking off triage crew...")
    result = crew.kickoff()

    # Extract the TriageObject from the crew output
    if hasattr(result, "pydantic") and result.pydantic is not None:
        triage_obj = result.pydantic
        logger.info(f"Crew completed. Level: {triage_obj.level}, Specialist: {triage_obj.specialist_id}")
        return triage_obj

    # Fallback: try to parse the raw output as JSON
    logger.warning("No pydantic output from crew — attempting JSON parse of raw output")
    try:
        raw_text = str(result.raw) if hasattr(result, "raw") else str(result)
        # Try to find JSON in the response
        json_start = raw_text.find("{")
        json_end = raw_text.rfind("}") + 1
        if json_start >= 0 and json_end > json_start:
            parsed = json.loads(raw_text[json_start:json_end])
            return TriageObject(**parsed)
    except Exception as e:
        logger.error(f"Failed to parse crew output: {e}")

    # Ultimate fallback: construct a safe default
    logger.error("Crew output could not be parsed — returning safe fallback")
    return TriageObject(
        level=schemas.TriageLevel.CONSULTATION_24,
        specialist_id="sp_1",
        specialist_name="General Practitioner",
        summary=f"Automated triage could not produce a confident assessment. "
                f"Patient complaint: {request.chief_complaint[:200]}. "
                f"Please review manually.",
        red_flags=["AI_PARSE_FAILURE — manual review required"],
        reasoning_path="The AI agents could not produce a valid structured output. "
                       "Defaulting to consultation_24 with a General Practitioner "
                       "for safety. Manual clinician review is required.",
    )


async def run_triage_crew_async(request: schemas.TriageRunRequest) -> TriageObject:
    """
    Async wrapper that runs the synchronous crew in a thread pool executor.
    This prevents blocking the FastAPI event loop.
    """
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, run_triage_crew, request)
