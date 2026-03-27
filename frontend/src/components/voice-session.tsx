"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import {
    LiveKitRoom,
    useVoiceAssistant,
    BarVisualizer,
    RoomAudioRenderer,
    DisconnectButton,
    useRoomContext,
} from "@livekit/components-react"
import "@livekit/components-styles"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, Phone, PhoneOff, Loader2 } from "lucide-react"

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

interface VoiceSessionProps {
    token: string
    livekitUrl: string
    roomName: string
    patientId: string
    onSessionComplete: (transcript: string) => void
    onError?: (error: string) => void
}

type SessionState = "connecting" | "active" | "completed" | "error"

// ------------------------------------------------------------------
// Inner component (must be inside LiveKitRoom)
// ------------------------------------------------------------------

function VoiceSessionInner({
    onSessionComplete,
    onError,
}: {
    onSessionComplete: (transcript: string) => void
    onError?: (error: string) => void
}) {
    const voiceAssistant = useVoiceAssistant()
    const room = useRoomContext()
    const [isMuted, setIsMuted] = useState(false)
    const [elapsed, setElapsed] = useState(0)
    const [sessionState, setSessionState] = useState<SessionState>("connecting")
    const [transcriptLines, setTranscriptLines] = useState<
        { speaker: string; text: string }[]
    >([])
    const transcriptRef = useRef<HTMLDivElement>(null)

    // Timer
    useEffect(() => {
        if (sessionState !== "active") return
        const timer = setInterval(() => setElapsed((e) => e + 1), 1000)
        return () => clearInterval(timer)
    }, [sessionState])

    // Update state based on voice assistant
    useEffect(() => {
        if (voiceAssistant.agent) {
            setSessionState("active")
        }
    }, [voiceAssistant.agent])

    // Auto-scroll transcript
    useEffect(() => {
        if (transcriptRef.current) {
            transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
        }
    }, [transcriptLines])

    // Collect agent transcription
    useEffect(() => {
        if (!room) return

        const handleData = (
            payload: Uint8Array,
            participant: any,
            kind: any,
            topic: string | undefined
        ) => {
            try {
                const decoded = new TextDecoder().decode(payload)
                const data = JSON.parse(decoded)
                if (data.text) {
                    const isAgent = participant?.identity?.startsWith("agent")
                    setTranscriptLines((prev) => [
                        ...prev,
                        {
                            speaker: isAgent ? "AI" : "You",
                            text: data.text,
                        },
                    ])
                }
            } catch {
                // ignore non-JSON data
            }
        }

        room.on("dataReceived", handleData)
        return () => {
            room.off("dataReceived", handleData)
        }
    }, [room])

    const toggleMute = useCallback(() => {
        if (!room) return
        const localParticipant = room.localParticipant
        localParticipant.setMicrophoneEnabled(isMuted)
        setIsMuted(!isMuted)
    }, [room, isMuted])

    const endSession = useCallback(() => {
        const fullTranscript = transcriptLines
            .map((l) => `${l.speaker}: ${l.text}`)
            .join("\n")
        setSessionState("completed")
        room?.disconnect()
        onSessionComplete(fullTranscript)
    }, [room, transcriptLines, onSessionComplete])

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60)
        const s = secs % 60
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
    }

    return (
        <div className="space-y-6">
            {/* Status bar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className={`w-3 h-3 rounded-full ${
                            sessionState === "active"
                                ? "bg-emerald-500 animate-pulse"
                                : sessionState === "connecting"
                                  ? "bg-amber-500 animate-pulse"
                                  : "bg-zinc-400"
                        }`}
                    />
                    <span className="text-sm font-medium text-zinc-600">
                        {sessionState === "connecting" && "Connecting to AI..."}
                        {sessionState === "active" && "Session Active"}
                        {sessionState === "completed" && "Session Ended"}
                    </span>
                </div>
                {sessionState === "active" && (
                    <Badge
                        variant="outline"
                        className="font-mono text-sm border-emerald-300 text-emerald-700 bg-emerald-50/50"
                    >
                        {formatTime(elapsed)}
                    </Badge>
                )}
            </div>

            {/* Voice visualizer */}
            <div className="relative rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-8 shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-teal-500/5" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px]" />

                <div className="relative z-10 flex flex-col items-center gap-6">
                    {sessionState === "connecting" ? (
                        <div className="flex flex-col items-center gap-4 py-8">
                            <Loader2 className="w-12 h-12 text-emerald-400 animate-spin" />
                            <p className="text-zinc-400 text-sm">
                                Connecting to TeleTriage AI...
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Audio visualizer */}
                            <div className="w-full h-24 flex items-center justify-center">
                                {voiceAssistant.agent && (
                                    <BarVisualizer
                                        state={voiceAssistant.state}
                                        barCount={32}
                                        trackRef={voiceAssistant.audioTrack}
                                        className="max-h-24"
                                        options={{
                                            minHeight: 4,
                                            maxHeight: 80,
                                        }}
                                    />
                                )}
                            </div>

                            {/* Speaking indicator */}
                            <p className="text-zinc-400 text-xs uppercase tracking-widest font-bold">
                                {voiceAssistant.state === "speaking"
                                    ? "AI is speaking..."
                                    : voiceAssistant.state === "listening"
                                      ? "Listening..."
                                      : "Processing..."}
                            </p>
                        </>
                    )}
                </div>
            </div>

            {/* Live transcript */}
            {transcriptLines.length > 0 && (
                <div
                    ref={transcriptRef}
                    className="max-h-48 overflow-y-auto rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 space-y-3"
                >
                    {transcriptLines.map((line, i) => (
                        <div
                            key={i}
                            className={`flex gap-2 text-sm ${
                                line.speaker === "AI"
                                    ? "text-emerald-700"
                                    : "text-zinc-700"
                            }`}
                        >
                            <span className="font-bold min-w-[2rem]">
                                {line.speaker}:
                            </span>
                            <span>{line.text}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
                <Button
                    variant="outline"
                    size="lg"
                    onClick={toggleMute}
                    disabled={sessionState !== "active"}
                    className={`rounded-full w-14 h-14 p-0 border-2 transition-all ${
                        isMuted
                            ? "border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100"
                            : "border-zinc-200 hover:border-emerald-300 hover:bg-emerald-50"
                    }`}
                >
                    {isMuted ? (
                        <MicOff className="w-5 h-5" />
                    ) : (
                        <Mic className="w-5 h-5" />
                    )}
                </Button>

                <Button
                    variant="destructive"
                    size="lg"
                    onClick={endSession}
                    disabled={sessionState !== "active"}
                    className="rounded-full w-14 h-14 p-0 bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-500/20"
                >
                    <PhoneOff className="w-5 h-5" />
                </Button>
            </div>

            {/* Hidden audio renderer */}
            <RoomAudioRenderer />
        </div>
    )
}

// ------------------------------------------------------------------
// Main exported component
// ------------------------------------------------------------------

export default function VoiceSession({
    token,
    livekitUrl,
    roomName,
    patientId,
    onSessionComplete,
    onError,
}: VoiceSessionProps) {
    return (
        <Card className="border-none bg-white shadow-2xl shadow-emerald-500/5 rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-zinc-50 bg-zinc-50/50 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                            <Phone className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">
                                Voice Triage Session
                            </CardTitle>
                            <p className="text-xs text-zinc-500">
                                Speak naturally — AI will guide the interview
                            </p>
                        </div>
                    </div>
                    <Badge
                        variant="outline"
                        className="border-emerald-300 text-emerald-600 bg-emerald-50/50"
                    >
                        AI Interview
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <LiveKitRoom
                    serverUrl={livekitUrl}
                    token={token}
                    connect={true}
                    audio={true}
                    video={false}
                    onDisconnected={() => {
                        // handled inside VoiceSessionInner
                    }}
                    onError={(err) => {
                        console.error("LiveKit error:", err)
                        onError?.(err.message)
                    }}
                >
                    <VoiceSessionInner
                        onSessionComplete={onSessionComplete}
                        onError={onError}
                    />
                </LiveKitRoom>
            </CardContent>
        </Card>
    )
}
