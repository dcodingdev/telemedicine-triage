"""
Seed Medical Documents
Utility to populate the medical_docs collection with sample reference data
and generate embeddings for Atlas Vector Search.

Usage:
  python seed_medical_docs.py
"""

import asyncio
import os
import logging
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()

logger = logging.getLogger(__name__)

# Sample medical reference documents for RAG
MEDICAL_DOCS = [
    {
        "category": "emergency",
        "source": "CDC Emergency Guidelines",
        "text": "Acute chest pain: Differential diagnosis includes acute coronary syndrome (ACS), pulmonary embolism, aortic dissection, tension pneumothorax, and cardiac tamponade. ACS is the most common life-threatening cause. Immediate ECG and troponin levels are indicated. Risk factors include age over 40, history of smoking, diabetes, hypertension, and family history of cardiac disease.",
    },
    {
        "category": "emergency",
        "source": "AHA Emergency Cardiovascular Care",
        "text": "Signs of stroke (FAST): Face drooping, Arm weakness, Speech difficulty, Time to call emergency services. Additional symptoms include sudden severe headache, confusion, trouble seeing in one or both eyes, trouble walking, dizziness, and loss of balance or coordination. Time-critical: tissue plasminogen activator (tPA) must be administered within 4.5 hours of symptom onset.",
    },
    {
        "category": "respiratory",
        "source": "NIH Respiratory Guidelines",
        "text": "Acute shortness of breath: Evaluate for asthma exacerbation, COPD exacerbation, pneumonia, heart failure, pulmonary embolism, and anxiety-related hyperventilation. Key assessment: respiratory rate, oxygen saturation, ability to speak in full sentences, use of accessory muscles, and lung auscultation findings. SpO2 below 94% requires supplemental oxygen.",
    },
    {
        "category": "abdominal",
        "source": "ACG Clinical Guidelines",
        "text": "Acute abdominal pain: Location-based differential diagnosis. Right upper quadrant: cholecystitis, hepatitis. Epigastric: peptic ulcer, pancreatitis, gastritis. Right lower quadrant: appendicitis, ovarian pathology. Left lower quadrant: diverticulitis, colitis. Diffuse: bowel obstruction, peritonitis, gastroenteritis. Severity assessment includes rebound tenderness, guarding, and vital sign instability.",
    },
    {
        "category": "neurological",
        "source": "AAN Practice Guidelines",
        "text": "Severe headache evaluation: Red flags include thunderclap onset (reaching maximum intensity in seconds), worst headache of life, new headache in patients over 50, headache with fever and neck stiffness (meningitis), headache with neurological deficits, and headache after head trauma. Subarachnoid hemorrhage must be ruled out with CT head followed by lumbar puncture if CT is negative.",
    },
    {
        "category": "pediatric",
        "source": "AAP Clinical Practice Guidelines",
        "text": "Pediatric fever management: For infants under 3 months with temperature ≥38°C (100.4°F), immediate medical evaluation is required due to risk of serious bacterial infection. For children 3-36 months, evaluation depends on appearance, activity level, and associated symptoms. High fever alone (up to 40°C/104°F) is not necessarily dangerous if the child appears well and is drinking fluids.",
    },
    {
        "category": "musculoskeletal",
        "source": "AAOS Clinical Guidelines",
        "text": "Acute musculoskeletal injury assessment: RICE protocol (Rest, Ice, Compression, Elevation) for initial management. Red flags requiring immediate evaluation: open fracture (bone visible through skin), neurovascular compromise (numbness, tingling, cold or pale extremity), compartment syndrome signs (pain disproportionate to injury, pain with passive stretch), and inability to bear weight after lower extremity injury.",
    },
    {
        "category": "mental_health",
        "source": "APA Clinical Practice Guidelines",
        "text": "Mental health crisis assessment: Evaluate for suicidal ideation using Columbia Suicide Severity Rating Scale (C-SSRS). Key questions: active vs. passive ideation, presence of plan, access to means, history of attempts, and protective factors. Any patient expressing suicidal ideation with a plan and access to means requires immediate psychiatric evaluation. Safety planning and means restriction are first-line interventions.",
    },
    {
        "category": "allergic",
        "source": "ACAAI Emergency Guidelines",
        "text": "Anaphylaxis recognition and management: Signs include urticaria/angioedema, respiratory compromise (wheezing, stridor), gastrointestinal symptoms (nausea, vomiting, diarrhea), and cardiovascular collapse (hypotension, tachycardia). Biphasic reactions can occur 1-72 hours after initial episode. Epinephrine is the first-line treatment. Common triggers include foods (peanuts, tree nuts, shellfish), insect stings, and medications.",
    },
    {
        "category": "infectious",
        "source": "CDC Infection Control Guidelines",
        "text": "Fever with rash evaluation: Consider measles (maculopapular, starts at face), varicella (vesicular, different stages simultaneously), meningococcemia (petechial/purpuric, rapid progression), rocky mountain spotted fever (starts at wrists/ankles), and drug reaction. Petechial rash with fever is a medical emergency until meningococcemia is ruled out. Assess vaccination history and recent exposures.",
    },
    {
        "category": "gastrointestinal",
        "source": "ACG Clinical Guidelines",
        "text": "Acute nausea and vomiting: Assess for dehydration (dry mucous membranes, decreased skin turgor, orthostatic hypotension). Warning signs include bloody or coffee-ground vomitus, bilious vomiting, abdominal distension, severe pain, and inability to keep fluids down for over 24 hours. Consider causes: gastroenteritis, food poisoning, pregnancy, appendicitis, bowel obstruction, and medication side effects.",
    },
    {
        "category": "dermatological",
        "source": "AAD Clinical Guidelines",
        "text": "Acute skin conditions requiring urgent evaluation: Cellulitis with rapidly spreading erythema or systemic symptoms, necrotizing fasciitis (disproportionate pain, crepitus, rapid progression), Steven-Johnson syndrome (widespread blistering, mucous membrane involvement), and herpes zoster ophthalmicus (vesicles near eye). Wound infections showing red streaks (lymphangitis) suggest systemic spread and require antibiotics.",
    },
]


async def seed_documents():
    """Seed the medical_docs collection with reference data and embeddings."""
    mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017/teletriage")
    client = AsyncIOMotorClient(mongo_uri)
    db = client.get_default_database()

    # Check if already seeded
    count = await db["medical_docs"].count_documents({})
    if count > 0:
        print(f"medical_docs already has {count} documents. Skipping seed.")
        print("To re-seed, drop the collection first: db.medical_docs.drop()")
        client.close()
        return

    google_api_key = os.getenv("GOOGLE_API_KEY", "")

    docs_to_insert = []
    for i, doc in enumerate(MEDICAL_DOCS):
        print(f"Processing doc {i+1}/{len(MEDICAL_DOCS)}: {doc['category']}...")

        doc_entry = {
            "category": doc["category"],
            "source": doc["source"],
            "text": doc["text"],
        }

        # Generate embedding if API key is available
        if google_api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=google_api_key)
                result = genai.embed_content(
                    model="models/text-embedding-004",
                    content=doc["text"],
                    task_type="retrieval_document",
                )
                doc_entry["embedding"] = result["embedding"]
                print(f"  ✓ Embedding generated ({len(result['embedding'])} dims)")
            except Exception as e:
                print(f"  ✗ Embedding failed: {e}")
        else:
            print("  ⚠ No GOOGLE_API_KEY — skipping embedding")

        docs_to_insert.append(doc_entry)

    # Insert all documents
    result = await db["medical_docs"].insert_many(docs_to_insert)
    print(f"\n✓ Inserted {len(result.inserted_ids)} medical reference documents")

    # Print Atlas Vector Search index creation instructions
    print("\n" + "=" * 60)
    print("ATLAS VECTOR SEARCH INDEX")
    print("=" * 60)
    print("If using MongoDB Atlas, create a Vector Search index:")
    print()
    print("Index name: vector_index")
    print("Collection: medical_docs")
    print("Definition:")
    print("""{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    }
  ]
}""")
    print("=" * 60)

    client.close()


if __name__ == "__main__":
    asyncio.run(seed_documents())
