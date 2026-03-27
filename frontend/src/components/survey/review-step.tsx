"use client"

import { useFormContext } from "react-hook-form"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { User, Activity, AlertTriangle, FileText } from "lucide-react"

export default function ReviewStep() {
    const { watch } = useFormContext()
    const data = watch()

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                    <User className="w-3 h-3" />
                    Patient Information
                </h3>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <p className="text-zinc-500">Name:</p>
                    <p className="font-semibold text-zinc-900">{data.first_name || "Self"} {data.last_name || "Patient"}</p>
                    <p className="text-zinc-500">DOB / Age:</p>
                    <p className="font-semibold text-zinc-900">{data.date_of_birth || "N/A"} ({data.age} yrs)</p>
                    <p className="text-zinc-500">Biological Sex:</p>
                    <p className="font-semibold text-zinc-900 capitalize">{data.sex_at_birth}</p>
                </div>
            </div>

            <Separator className="bg-zinc-50" />

            <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                    <Activity className="w-3 h-3" />
                    Clinical Baseline
                </h3>
                <div className="space-y-3">
                    <div>
                        <p className="text-xs font-bold text-zinc-400 mb-2">CHRONIC CONDITIONS</p>
                        <div className="flex flex-wrap gap-2">
                            {data.chronic_conditions?.length > 0 ? data.chronic_conditions.map((c: string) => (
                                <Badge key={c} variant="secondary" className="bg-zinc-100 text-zinc-700">{c}</Badge>
                            )) : <p className="text-xs text-zinc-400 italic">No conditions reported</p>}
                        </div>
                    </div>
                </div>
            </div>

            <Separator className="bg-zinc-50" />

            <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                    <FileText className="w-3 h-3" />
                    Chief Complaint
                </h3>
                <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                    <p className="text-sm text-zinc-800 leading-relaxed italic">"{data.chief_complaint}"</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs font-bold">
                    <div className={`p-4 rounded-xl border ${data.smoker ? 'bg-amber-50 border-amber-100 text-amber-800' : 'bg-zinc-50 border-zinc-100 text-zinc-500'}`}>
                        SMOKER: {data.smoker ? "YES" : "NO"}
                    </div>
                    <div className={`p-4 rounded-xl border ${data.alcohol_use !== 'none' ? 'bg-amber-50 border-amber-100 text-amber-800' : 'bg-zinc-50 border-zinc-100 text-zinc-500'}`}>
                        ALCOHOL: {data.alcohol_use.toUpperCase()}
                    </div>
                </div>
            </div>

            <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-100">
                <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-emerald-900">Legal Agreement</p>
                        <p className="text-xs text-emerald-700 leading-relaxed mt-1">
                            By submitting this triage assessment, you agree that this system is for information purposes only and does not replace professional medical advice.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
