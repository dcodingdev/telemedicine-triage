"""
RAG Enrichment Module
Handles vector embedding generation and medical document retrieval
using Google Gemini embeddings and MongoDB Atlas Vector Search.
"""

import os
import logging
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")

# --- Embedding Generation ---

async def generate_embedding(text: str) -> Optional[List[float]]:
    """
    Generate a vector embedding for the given text using Gemini text-embedding-004.
    Returns None if the API key is not configured or the call fails.
    """
    if not GOOGLE_API_KEY:
        logger.warning("GOOGLE_API_KEY not set — skipping embedding generation")
        return None

    try:
        import google.generativeai as genai
        genai.configure(api_key=GOOGLE_API_KEY)

        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text,
            task_type="retrieval_query",
        )
        return result["embedding"]
    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        return None


# --- Vector Search ---

async def search_medical_context(
    db, query_vector: List[float], k: int = 5
) -> List[dict]:
    """
    Run a $vectorSearch aggregation against the medical_docs collection.
    Falls back to text search if vector search index is not available.
    """
    try:
        pipeline = [
            {
                "$vectorSearch": {
                    "index": "vector_index",
                    "path": "embedding",
                    "queryVector": query_vector,
                    "numCandidates": 100,
                    "limit": k,
                }
            },
            {
                "$project": {
                    "text": 1,
                    "source": 1,
                    "category": 1,
                    "score": {"$meta": "vectorSearchScore"},
                }
            },
        ]
        results = await db["medical_docs"].aggregate(pipeline).to_list(length=k)
        return results
    except Exception as e:
        logger.warning(f"Vector search failed (likely no Atlas index): {e}")
        return await _fallback_text_search(db, k)


async def _fallback_text_search(db, k: int = 5) -> List[dict]:
    """
    Simple fallback: return the first k medical docs if vector search is unavailable.
    """
    try:
        results = (
            await db["medical_docs"]
            .find({}, {"text": 1, "source": 1, "category": 1})
            .limit(k)
            .to_list(length=k)
        )
        return results
    except Exception:
        return []


# --- Enrichment Orchestrator ---

async def enrich_triage(db, transcript: str, patient_id: str) -> dict:
    """
    Full RAG enrichment pipeline:
    1. Generate embedding from transcript
    2. Search for relevant medical context
    3. Use Gemini to generate an enriched clinical summary
    4. Store and return the enriched result
    """
    from datetime import datetime
    import schemas

    # Step 1: Generate embedding
    query_vector = await generate_embedding(transcript)

    # Step 2: Search for context
    context_snippets = []
    if query_vector:
        raw_results = await search_medical_context(db, query_vector)
        context_snippets = [
            schemas.RAGSnippet(
                text=r.get("text", ""),
                source=r.get("source", "medical_reference"),
                relevance_score=r.get("score", 0.0),
            )
            for r in raw_results
        ]

    # Step 3: Generate enriched summary
    enriched_summary = await _generate_enriched_summary(transcript, context_snippets)

    # Step 4: Determine emergency level from transcript
    emergency_level = _assess_emergency_level(transcript)

    # Build the result
    rag_result = schemas.RAGResult(
        context_snippets=context_snippets,
        enriched_summary=enriched_summary,
        medical_references=[s.source for s in context_snippets],
    )

    result_dict = {
        "patient_id": patient_id,
        "emergency_level": emergency_level,
        "suggested_action": _get_suggested_action(emergency_level),
        "summary": enriched_summary or f"Voice triage transcript received ({len(transcript)} chars)",
        "transcript": transcript,
        "rag_context": rag_result.model_dump(),
        "created_at": datetime.utcnow(),
    }

    # Save to DB
    res = await db["triage_results"].insert_one(result_dict)
    result_dict["id"] = str(res.inserted_id)

    return result_dict


async def _generate_enriched_summary(
    transcript: str, snippets: list
) -> str:
    """
    Use Gemini to generate a clinical summary from the transcript and medical context.
    """
    if not GOOGLE_API_KEY:
        return f"Voice intake recorded. Transcript: {transcript[:200]}..."

    try:
        import google.generativeai as genai
        genai.configure(api_key=GOOGLE_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")

        context_text = "\n".join([s.text for s in snippets]) if snippets else "No medical context retrieved."

        prompt = f"""You are a medical triage assistant. Based on the patient's voice description and the retrieved medical reference context, provide a concise clinical summary.

PATIENT TRANSCRIPT:
{transcript}

MEDICAL REFERENCE CONTEXT:
{context_text}

Provide a clinical summary in 2-3 sentences that includes:
1. Key symptoms identified
2. Potential differential diagnoses based on the reference context
3. Recommended urgency level and next steps

Keep the response professional and concise."""

        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        logger.error(f"Gemini summary generation failed: {e}")
        return f"Voice intake recorded. Transcript: {transcript[:200]}..."


def _assess_emergency_level(transcript: str) -> str:
    """Rule-based emergency assessment from transcript content."""
    text = transcript.lower()

    critical_keywords = [
        "chest pain", "can't breathe", "cannot breathe", "difficulty breathing",
        "unconscious", "severe bleeding", "stroke", "heart attack",
        "choking", "seizure", "anaphylaxis",
    ]
    high_keywords = [
        "high fever", "vomiting blood", "persistent pain", "broken bone",
        "head injury", "severe headache", "blurred vision", "numbness",
    ]
    medium_keywords = [
        "fever", "pain", "nausea", "vomiting", "dizziness", "swelling",
        "infection", "rash", "cough",
    ]

    if any(kw in text for kw in critical_keywords):
        return "critical"
    elif any(kw in text for kw in high_keywords):
        return "high"
    elif any(kw in text for kw in medium_keywords):
        return "medium"
    return "low"


def _get_suggested_action(level: str) -> str:
    """Map emergency level to suggested action."""
    actions = {
        "critical": "Seek emergency medical care immediately. Call 911 or go to the nearest ER.",
        "high": "Consult a doctor as soon as possible. Consider urgent care or ER visit.",
        "medium": "Schedule an appointment with your healthcare provider within 24-48 hours.",
        "low": "Monitor symptoms. Consult a doctor if symptoms worsen or persist.",
    }
    return actions.get(level, actions["low"])
