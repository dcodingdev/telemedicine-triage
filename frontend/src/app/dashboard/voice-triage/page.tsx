"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { apiClient } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mic, Shield, Clock, ArrowLeft, Loader2, AlertCircle } from "lucide-react"
import VoiceSession from "@/components/voice-session"
import TriageResults from "@/components/triage-results"

type PageState = "pre-session" | "connecting" | "active" | "processing" | "results" | "error"

export default function VoiceTriagePage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const patientId = searchParams.get("patient_id") || ""

    const [pageState, setPageState] = useState<PageState>("pre-session")
    const [token, setToken] = useState("")
    const [livekitUrl, setLivekitUrl] = useState("")
    const [roomName, setRoomName] = useState("")
    const [triageResult, setTriageResult] = useState<any>(null)
    const [errorMsg, setErrorMsg] = useState("")

    const startVoiceSession = useCallback(async () => {
        if (!patientId) {
            setErrorMsg("No patient ID provided. Please complete the survey first.")
            setPageState("error")
            return
        }

        setPageState("connecting")

        try {
            const response = await apiClient.post("/voice/token", {
                patient_id: patientId,
            })
            setToken(response.token)
            setLivekitUrl(response.livekit_url)
            setRoomName(response.room_name)
            setPageState("active")
        } catch (err: any) {
            console.error("Failed to get voice token:", err)
            setErrorMsg(
                err.message || "Failed to connect to voice service. Please check your LiveKit configuration."
            )
            setPageState("error")
        }
    }, [patientId])

    const handleSessionComplete = useCallback(
        async (transcript: string) => {
            setPageState("processing")

            try {
                const response = await apiClient.post("/voice/session-complete", {
                    room_name: roomName,
                    transcript,
                    patient_id: patientId,
                })

                if (response.triage_result) {
                    setTriageResult(response.triage_result)
                } else {
                    // Fallback — try to fetch results
                    const results = await apiClient.get(`/voice/results/${patientId}`)
                    setTriageResult(results)
                }
                setPageState("results")
            } catch (err: any) {
                console.error("Failed to process results:", err)
                // Show results with just the transcript
                setTriageResult({
                    id: "local",
                    patient_id: patientId,
                    emergency_level: "low",
                    suggested_action: "Review transcript with a healthcare provider.",
                    summary: `Voice session completed. Transcript: ${transcript.substring(0, 200)}...`,
                    transcript,
                    created_at: new Date().toISOString(),
                })
                setPageState("results")
            }
        },
        [roomName, patientId]
    )

    // Pre-session landing
    if (pageState === "pre-session") {
        return (
            <div className="max-w-2xl mx-auto py-10 px-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="space-y-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/dashboard")}
                        className="text-zinc-500 hover:text-zinc-900 -ml-2 gap-1"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Button>
                    <h2 className="text-2xl font-bold text-zinc-900">
                        Voice Triage Interview
                    </h2>
                    <p className="text-zinc-500">
                        Speak with our AI assistant to provide detailed symptom information.
                    </p>
                </div>

                <Card className="border-none bg-white shadow-2xl shadow-emerald-500/5 rounded-3xl overflow-hidden">
                    <CardContent className="p-8 space-y-8">
                        {/* Visual hero */}
                        <div className="relative rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-10 text-center overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-teal-500/10" />
                            <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/20 rounded-full blur-[80px]" />
                            <div className="relative z-10 space-y-4">
                                <div className="w-20 h-20 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500/30">
                                    <Mic className="w-10 h-10 text-emerald-400" />
                                </div>
                                <h3 className="text-white text-xl font-bold">
                                    TeleTriage AI Voice Assistant
                                </h3>
                                <p className="text-zinc-400 text-sm max-w-md mx-auto">
                                    Our AI will conduct a brief medical interview to understand
                                    your symptoms. Speak naturally — it will guide you through
                                    the process.
                                </p>
                            </div>
                        </div>

                        {/* Feature badges */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                                <Shield className="w-5 h-5 text-emerald-600" />
                                <span className="text-xs font-semibold text-zinc-600 text-center">
                                    HIPAA Compliant
                                </span>
                            </div>
                            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                                <Mic className="w-5 h-5 text-emerald-600" />
                                <span className="text-xs font-semibold text-zinc-600 text-center">
                                    AI Transcription
                                </span>
                            </div>
                            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                                <Clock className="w-5 h-5 text-emerald-600" />
                                <span className="text-xs font-semibold text-zinc-600 text-center">
                                    ~3 Min Session
                                </span>
                            </div>
                        </div>

                        {/* Start button */}
                        <Button
                            size="lg"
                            onClick={startVoiceSession}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl h-14 text-lg font-bold shadow-xl shadow-emerald-500/20 transition-all transform hover:scale-[1.02]"
                        >
                            <Mic className="w-5 h-5 mr-2" />
                            Start Voice Triage
                        </Button>

                        <p className="text-[11px] text-zinc-400 text-center leading-relaxed">
                            By starting, you consent to audio recording for medical triage
                            purposes. Your conversation is processed by AI and reviewed by
                            licensed clinicians. No data is shared with third parties.
                        </p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Connecting state
    if (pageState === "connecting") {
        return (
            <div className="max-w-2xl mx-auto py-20 px-4 flex flex-col items-center gap-6">
                <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
                <div className="text-center space-y-1">
                    <p className="font-semibold text-zinc-900">
                        Initializing Voice Session
                    </p>
                    <p className="text-sm text-zinc-500">
                        Connecting to AI triage assistant...
                    </p>
                </div>
            </div>
        )
    }

    // Active voice session
    if (pageState === "active" && token) {
        return (
            <div className="max-w-2xl mx-auto py-10 px-4 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-zinc-900">
                        Voice Interview
                    </h2>
                    <Badge
                        variant="outline"
                        className="border-emerald-300 text-emerald-600 bg-emerald-50/50 animate-pulse"
                    >
                        Live Session
                    </Badge>
                </div>
                <VoiceSession
                    token={token}
                    livekitUrl={livekitUrl}
                    roomName={roomName}
                    patientId={patientId}
                    onSessionComplete={handleSessionComplete}
                    onError={(err) => {
                        setErrorMsg(err)
                        setPageState("error")
                    }}
                />
            </div>
        )
    }

    // Processing state
    if (pageState === "processing") {
        return (
            <div className="max-w-2xl mx-auto py-20 px-4 flex flex-col items-center gap-6">
                <div className="relative">
                    <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
                    <div className="absolute inset-0 w-12 h-12 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
                </div>
                <div className="text-center space-y-1">
                    <p className="font-semibold text-zinc-900">
                        Analyzing Your Symptoms
                    </p>
                    <p className="text-sm text-zinc-500">
                        Running RAG enrichment with medical references...
                    </p>
                </div>
            </div>
        )
    }

    // Results
    if (pageState === "results" && triageResult) {
        return (
            <div className="max-w-2xl mx-auto py-10 px-4 space-y-6">
                <div className="space-y-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/dashboard")}
                        className="text-zinc-500 hover:text-zinc-900 -ml-2 gap-1"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Button>
                    <h2 className="text-2xl font-bold text-zinc-900">
                        Your Triage Results
                    </h2>
                </div>
                <TriageResults
                    result={triageResult}
                    onBookConsultation={() => router.push("/dashboard")}
                    onNewTriage={() => router.push("/dashboard/survey")}
                />
            </div>
        )
    }

    // Error state
    return (
        <div className="max-w-2xl mx-auto py-20 px-4 flex flex-col items-center gap-6">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-rose-600" />
            </div>
            <div className="text-center space-y-2 max-w-md">
                <p className="font-semibold text-zinc-900">
                    Voice Session Error
                </p>
                <p className="text-sm text-zinc-500">
                    {errorMsg || "An unexpected error occurred. Please try again."}
                </p>
            </div>
            <div className="flex gap-3">
                <Button
                    variant="outline"
                    onClick={() => router.push("/dashboard")}
                    className="rounded-xl"
                >
                    Back to Dashboard
                </Button>
                <Button
                    onClick={() => setPageState("pre-session")}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl"
                >
                    Try Again
                </Button>
            </div>
        </div>
    )
}
