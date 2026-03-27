"""
LiveKit Triage Voice Agent
Runs as a separate worker process alongside the FastAPI server.

Usage:
  python agent.py dev          # Development mode (connects to LiveKit Cloud)
  python agent.py console      # Console mode (local testing in terminal)
  python agent.py download-files  # Download required model files

Requires:
  LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET, GOOGLE_API_KEY
"""

import os
import logging
from dotenv import load_dotenv

load_dotenv()
load_dotenv(".env.local")

logger = logging.getLogger("triage-agent")

from livekit import agents, rtc
from livekit.agents import AgentServer, AgentSession, Agent, room_io, TurnHandlingOptions
from livekit.plugins import google, noise_cancellation, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel


# ---------------------------------------------------------------------------
# Triage assistant agent definition
# ---------------------------------------------------------------------------

TRIAGE_INSTRUCTIONS = """You are TeleTriage AI, a professional yet warm medical triage voice assistant.

YOUR ROLE:
- Gather detailed symptom information through a natural, conversational interview.
- You are NOT diagnosing. You are collecting data to help a human clinician prioritize care.

INTERVIEW PROTOCOL — follow this order:
1. GREETING: Introduce yourself warmly. Example: "Hi, I'm TeleTriage AI. I'm here to understand your symptoms so we can connect you with the right care."
2. CHIEF COMPLAINT: Ask what brought them in today. Let them describe freely.
3. ONSET: When did it start? Was it sudden or gradual?
4. LOCATION: Where exactly? Does it radiate anywhere?
5. DURATION: How long has it been going on? Is it constant or intermittent?
6. SEVERITY: On a scale of 0 to 10, how severe? Has it changed?
7. CHARACTER: What does it feel like? Sharp, dull, burning, throbbing?
8. AGGRAVATING / ALLEVIATING: What makes it worse? What makes it better?
9. ASSOCIATED SYMPTOMS: Any other symptoms? Nausea, fever, dizziness, shortness of breath?
10. HISTORY: Have you had this before? Any relevant medical history?

COMMUNICATION RULES:
- Ask ONE question at a time. Wait for the answer before proceeding.
- Use simple, non-medical language.
- Show empathy: "I understand that must be uncomfortable."
- If something sounds urgent (chest pain, difficulty breathing, severe bleeding), calmly say: "Based on what you're describing, I would recommend seeking immediate medical attention."
- Keep responses concise — you are a voice assistant, not a chatbot.
- Do not use emojis, asterisks, special formatting, or markdown.
- At the end, summarize what you heard and thank the patient.
"""

TRIAGE_INSTRUCTIONS_WITH_HISTORY = """You are TeleTriage AI, a professional medical triage voice assistant.
You have access to this patient's medical history from their intake form.

{patient_context}

Use this context to ask more targeted follow-up questions.
For example, if they have asthma and report chest tightness, ask:
"I see you have a history of asthma. Is this chest pain affecting your breathing differently than usual?"

Otherwise, follow the same interview protocol:
1. Greet warmly
2. Ask about chief complaint
3. Onset, Location, Duration, Severity, Character
4. Aggravating / Alleviating factors
5. Associated symptoms
6. Relate to their known medical history

COMMUNICATION RULES:
- One question at a time
- Simple language, empathetic tone
- No emojis, asterisks, or markdown
- Flag urgent symptoms clearly
- Summarize at the end
"""


class TriageAssistant(Agent):
    """Medical triage voice AI agent."""

    def __init__(self, patient_context: str = "") -> None:
        if patient_context:
            instructions = TRIAGE_INSTRUCTIONS_WITH_HISTORY.format(
                patient_context=patient_context
            )
        else:
            instructions = TRIAGE_INSTRUCTIONS

        super().__init__(instructions=instructions)


# ---------------------------------------------------------------------------
# Agent server and session setup
# ---------------------------------------------------------------------------

server = AgentServer()


@server.rtc_session(agent_name="triage-agent")
async def triage_session(ctx: agents.JobContext):
    """
    Entry point for each voice triage session.
    LiveKit dispatches this when a participant joins a triage room.
    """

    # Check if patient context was passed via participant metadata
    patient_context = ""
    room = ctx.room

    # Wait for participant to connect
    await ctx.wait_for_participant()

    # Try to extract patient context from room metadata or participant metadata
    for participant in room.remote_participants.values():
        if participant.metadata:
            try:
                import json
                meta = json.loads(participant.metadata)
                patient_context = meta.get("patient_history", "")
            except (json.JSONDecodeError, AttributeError):
                pass

    # Create the agent session with Google Gemini STT-LLM-TTS pipeline
    session = AgentSession(
        stt=google.STT(
            model="chirp",
        ),
        llm=google.LLM(
            model="gemini-2.5-flash",
        ),
        tts=google.TTS(
            gender="female",
            voice_name="en-US-Standard-H",
        ),
        vad=silero.VAD.load(),
        turn_handling=TurnHandlingOptions(
            turn_detection=MultilingualModel(),
        ),
    )

    await session.start(
        room=ctx.room,
        agent=TriageAssistant(patient_context=patient_context),
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=lambda params: (
                    noise_cancellation.BVCTelephony()
                    if params.participant.kind == rtc.ParticipantKind.PARTICIPANT_KIND_SIP
                    else noise_cancellation.BVC()
                ),
            ),
        ),
    )

    # Generate initial greeting
    await session.generate_reply(
        instructions="Greet the patient warmly and ask them what brought them in today."
    )


if __name__ == "__main__":
    agents.cli.run_app(server)
