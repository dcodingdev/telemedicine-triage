"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    AlertTriangle,
    CheckCircle,
    AlertCircle,
    XCircle,
    FileText,
    BookOpen,
    ChevronDown,
    ChevronUp,
    Calendar,
} from "lucide-react"
import { useState } from "react"

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

interface RAGSnippet {
    text: string
    source: string
    relevance_score: number
}

interface TriageResultData {
    id: string
    patient_id: string
    emergency_level: string
    suggested_action: string
    summary: string
    transcript?: string
    rag_context?: {
        context_snippets: RAGSnippet[]
        enriched_summary: string
        medical_references: string[]
    }
    created_at: string
}

interface TriageResultsProps {
    result: TriageResultData
    onBookConsultation?: () => void
    onNewTriage?: () => void
}

// ------------------------------------------------------------------
// Helper: Emergency badge
// ------------------------------------------------------------------

function EmergencyBadge({ level }: { level: string }) {
    const config: Record<
        string,
        { color: string; icon: React.ReactNode; label: string }
    > = {
        critical: {
            color: "bg-red-100 text-red-700 border-red-300",
            icon: <XCircle className="w-4 h-4" />,
            label: "CRITICAL",
        },
        high: {
            color: "bg-amber-100 text-amber-700 border-amber-300",
            icon: <AlertTriangle className="w-4 h-4" />,
            label: "HIGH",
        },
        medium: {
            color: "bg-yellow-100 text-yellow-700 border-yellow-300",
            icon: <AlertCircle className="w-4 h-4" />,
            label: "MEDIUM",
        },
        low: {
            color: "bg-emerald-100 text-emerald-700 border-emerald-300",
            icon: <CheckCircle className="w-4 h-4" />,
            label: "LOW",
        },
    }

    const c = config[level] || config.low

    return (
        <Badge
            variant="outline"
            className={`${c.color} gap-1.5 py-1.5 px-3 text-sm font-bold border`}
        >
            {c.icon}
            {c.label}
        </Badge>
    )
}

// ------------------------------------------------------------------
// Main component
// ------------------------------------------------------------------

export default function TriageResults({
    result,
    onBookConsultation,
    onNewTriage,
}: TriageResultsProps) {
    const [showTranscript, setShowTranscript] = useState(false)
    const [expandedSnippet, setExpandedSnippet] = useState<number | null>(null)

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header card */}
            <Card className="border-none bg-white shadow-2xl shadow-emerald-500/5 rounded-3xl overflow-hidden">
                <CardHeader className="p-6 bg-gradient-to-r from-zinc-50 to-emerald-50/30 border-b border-zinc-100">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-xl">
                                Triage Assessment
                            </CardTitle>
                            <p className="text-xs text-zinc-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(result.created_at).toLocaleString()}
                            </p>
                        </div>
                        <EmergencyBadge level={result.emergency_level} />
                    </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    {/* Summary */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">
                            Clinical Summary
                        </h3>
                        <p className="text-zinc-700 leading-relaxed">
                            {result.summary}
                        </p>
                    </div>

                    {/* Suggested action */}
                    <div
                        className={`p-4 rounded-2xl border ${
                            result.emergency_level === "critical"
                                ? "bg-red-50 border-red-200"
                                : result.emergency_level === "high"
                                  ? "bg-amber-50 border-amber-200"
                                  : "bg-emerald-50 border-emerald-200"
                        }`}
                    >
                        <p className="text-sm font-semibold mb-1">
                            Recommended Action
                        </p>
                        <p className="text-sm text-zinc-700">
                            {result.suggested_action}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Transcript section */}
            {result.transcript && (
                <Card className="border-none bg-white shadow-sm rounded-3xl overflow-hidden">
                    <button
                        onClick={() => setShowTranscript(!showTranscript)}
                        className="w-full p-5 flex items-center justify-between hover:bg-zinc-50/50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-zinc-400" />
                            <span className="font-semibold text-zinc-700">
                                Voice Transcript
                            </span>
                        </div>
                        {showTranscript ? (
                            <ChevronUp className="w-5 h-5 text-zinc-400" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-zinc-400" />
                        )}
                    </button>
                    {showTranscript && (
                        <div className="px-5 pb-5 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="bg-zinc-50 rounded-xl p-4 max-h-64 overflow-y-auto">
                                <pre className="text-sm text-zinc-600 whitespace-pre-wrap font-sans leading-relaxed">
                                    {result.transcript}
                                </pre>
                            </div>
                        </div>
                    )}
                </Card>
            )}

            {/* RAG Context section */}
            {result.rag_context &&
                result.rag_context.context_snippets.length > 0 && (
                    <Card className="border-none bg-white shadow-sm rounded-3xl overflow-hidden">
                        <CardHeader className="p-5 pb-3">
                            <div className="flex items-center gap-3">
                                <BookOpen className="w-5 h-5 text-emerald-600" />
                                <CardTitle className="text-base">
                                    Medical References
                                </CardTitle>
                                <Badge
                                    variant="secondary"
                                    className="bg-emerald-100 text-emerald-700 text-[10px]"
                                >
                                    RAG Enhanced
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="px-5 pb-5 space-y-3">
                            {result.rag_context.context_snippets.map(
                                (snippet, i) => (
                                    <div
                                        key={i}
                                        className="rounded-xl border border-zinc-100 overflow-hidden transition-all hover:shadow-sm"
                                    >
                                        <button
                                            onClick={() =>
                                                setExpandedSnippet(
                                                    expandedSnippet === i
                                                        ? null
                                                        : i
                                                )
                                            }
                                            className="w-full p-3 flex items-center justify-between hover:bg-zinc-50/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                <span className="text-sm font-medium text-zinc-700">
                                                    {snippet.source}
                                                </span>
                                            </div>
                                            {snippet.relevance_score > 0 && (
                                                <span className="text-[10px] text-zinc-400 font-mono">
                                                    {(
                                                        snippet.relevance_score *
                                                        100
                                                    ).toFixed(0)}
                                                    % match
                                                </span>
                                            )}
                                        </button>
                                        {expandedSnippet === i && (
                                            <div className="px-3 pb-3 animate-in fade-in duration-200">
                                                <p className="text-sm text-zinc-600 leading-relaxed bg-zinc-50 rounded-lg p-3">
                                                    {snippet.text}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )
                            )}
                        </CardContent>
                    </Card>
                )}

            {/* Action buttons */}
            <div className="flex gap-4">
                {onBookConsultation && (
                    <Button
                        size="lg"
                        onClick={onBookConsultation}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl h-12 shadow-lg shadow-emerald-500/20 font-semibold"
                    >
                        Book Consultation
                    </Button>
                )}
                {onNewTriage && (
                    <Button
                        size="lg"
                        variant="outline"
                        onClick={onNewTriage}
                        className="flex-1 rounded-xl h-12 font-semibold"
                    >
                        New Triage
                    </Button>
                )}
            </div>
        </div>
    )
}
