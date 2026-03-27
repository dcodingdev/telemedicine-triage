"""
Voice Session Routes
Handles LiveKit room token generation and voice session lifecycle.
"""

import os
import uuid
import logging
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, status
from dotenv import load_dotenv

import schemas
from database import get_db
from auth import get_current_user
from rag import enrich_triage

load_dotenv()

logger = logging.getLogger(__name__)

router = APIRouter()

LIVEKIT_URL = os.getenv("LIVEKIT_URL", "")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY", "")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET", "")


@router.post("/voice/token", response_model=schemas.VoiceTokenResponse)
async def get_voice_token(
    req: schemas.VoiceTokenRequest,
    current_user: schemas.UserResponse = Depends(get_current_user),
    db=Depends(get_db),
):
    """
    Generate a LiveKit room token for a voice triage session.
    Creates a unique room tied to the patient and user.
    """
    if not all([LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET]):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="LiveKit is not configured. Set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET.",
        )

    # Verify patient belongs to user
    from bson import ObjectId

    patient_doc = await db["patients"].find_one(
        {"_id": ObjectId(req.patient_id), "user_id": current_user.id}
    )
    if not patient_doc:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Create unique room name
    room_name = f"triage-{req.patient_id}-{uuid.uuid4().hex[:8]}"

    try:
        from livekit.api import AccessToken, VideoGrants

        token = (
            AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
            .with_identity(f"patient-{current_user.id}")
            .with_name(f"{current_user.first_name} {current_user.last_name}")
            .with_grants(
                VideoGrants(
                    room_join=True,
                    room=room_name,
                )
            )
            .with_metadata(
                f'{{"patient_id": "{req.patient_id}", "user_id": "{current_user.id}"}}'
            )
        )
        token_str = token.to_jwt()
    except Exception as e:
        logger.error(f"Token generation failed: {e}")
        raise HTTPException(
            status_code=500, detail=f"Failed to generate LiveKit token: {str(e)}"
        )

    # Store session record
    session_record = {
        "room_name": room_name,
        "patient_id": req.patient_id,
        "user_id": current_user.id,
        "status": "pending",
        "created_at": datetime.utcnow(),
    }
    await db["voice_sessions"].insert_one(session_record)

    return schemas.VoiceTokenResponse(
        token=token_str,
        room_name=room_name,
        livekit_url=LIVEKIT_URL,
    )


@router.post("/voice/session-complete")
async def voice_session_complete(
    req: schemas.VoiceSessionComplete,
    current_user: schemas.UserResponse = Depends(get_current_user),
    db=Depends(get_db),
):
    """
    Called when the voice session ends. Receives the final transcript
    and triggers RAG enrichment + agentic triage.
    """
    # Update session status
    await db["voice_sessions"].update_one(
        {"room_name": req.room_name},
        {
            "$set": {
                "status": "completed",
                "transcript": req.transcript,
                "completed_at": datetime.utcnow(),
            }
        },
    )

    # Run RAG enrichment
    enriched = None
    try:
        enriched = await enrich_triage(db, req.transcript, req.patient_id)
    except Exception as e:
        logger.error(f"Enrichment failed: {e}")
        return {
            "status": "transcript_saved",
            "transcript": req.transcript,
            "error": str(e),
        }

    # Trigger agentic triage (Phase 3) in background
    triage_object = None
    try:
        from crew_triage import run_triage_crew_async

        # Build the triage request from the enriched data
        rag_context_text = ""
        if enriched and enriched.get("rag_context"):
            snippets = enriched["rag_context"].get("context_snippets", [])
            rag_context_text = "\n".join([s.get("text", "") for s in snippets])

        triage_request = schemas.TriageRunRequest(
            patient_id=req.patient_id,
            chief_complaint=enriched.get("summary", req.transcript[:500]),
            transcript=req.transcript,
            rag_context=rag_context_text or None,
        )

        triage_object = await run_triage_crew_async(triage_request)

        # Persist the agentic triage result
        await db["agentic_triage_results"].insert_one({
            "patient_id": req.patient_id,
            "triage_object": triage_object.model_dump(),
            "created_at": datetime.utcnow(),
        })
        logger.info(f"Agentic triage completed: level={triage_object.level}")
    except Exception as e:
        logger.warning(f"Agentic triage failed (non-fatal): {e}")

    return {
        "status": "enriched",
        "triage_result": enriched,
        "triage_object": triage_object.model_dump() if triage_object else None,
    }


@router.get("/voice/results/{patient_id}")
async def get_voice_results(
    patient_id: str,
    current_user: schemas.UserResponse = Depends(get_current_user),
    db=Depends(get_db),
):
    """
    Get the latest enriched triage results for a patient.
    """
    from bson import ObjectId

    # Verify patient belongs to user
    patient_doc = await db["patients"].find_one(
        {"_id": ObjectId(patient_id), "user_id": current_user.id}
    )
    if not patient_doc:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Get latest triage result
    result = await db["triage_results"].find_one(
        {"patient_id": patient_id},
        sort=[("created_at", -1)],
    )

    if not result:
        raise HTTPException(status_code=404, detail="No triage results found")

    result["id"] = str(result["_id"])
    return result
