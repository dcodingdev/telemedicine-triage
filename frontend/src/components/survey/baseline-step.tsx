"use client"

import { useFormContext } from "react-hook-form"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X, Plus, Pill, AlertTriangle, Activity } from "lucide-react"

const conditions = [
    "Hypertension", "Diabetes (Type 1)", "Diabetes (Type 2)", 
    "Asthma", "Heart Disease", "Thyroid Issues", 
    "COPD", "Kidney Disease", "Previous Surgeries"
]

export default function BaselineStep() {
    const { setValue, watch } = useFormContext()
    const selectedConditions = watch("chronic_conditions") || []
    const medications = watch("current_medications") || []
    const allergies = watch("allergies") || []

    const [medInput, setMedInput] = useState("")
    const [allergyInput, setAllergyInput] = useState("")

    const toggleCondition = (val: string) => {
        const updated = selectedConditions.includes(val)
            ? selectedConditions.filter((c: string) => c !== val)
            : [...selectedConditions, val]
        setValue("chronic_conditions", updated)
    }

    const addItem = (field: string, val: string, setInput: (v: string) => void) => {
        if (!val.trim()) return
        const current = watch(field) || []
        setValue(field, [...current, val.trim()])
        setInput("")
    }

    const removeItem = (field: string, val: string) => {
        const current = watch(field) || []
        setValue(field, current.filter((i: string) => i !== val))
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-4">
                <Label className="text-zinc-900 font-bold flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    Chronic Conditions
                </Label>
                <div className="grid grid-cols-2 gap-3">
                    {conditions.map(c => (
                        <div key={c} className={`flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer ${selectedConditions.includes(c) ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-zinc-100 hover:border-zinc-200'}`} onClick={() => toggleCondition(c)}>
                            <Checkbox id={c} checked={selectedConditions.includes(c)} onCheckedChange={() => toggleCondition(c)} />
                            <label htmlFor={c} className="text-sm font-medium leading-none cursor-pointer text-zinc-700">
                                {c}
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <Label className="text-zinc-900 font-bold flex items-center gap-2">
                    <Pill className="w-4 h-4 text-emerald-600" />
                    Current Medications
                </Label>
                <div className="flex gap-2">
                    <Input 
                        value={medInput} 
                        onChange={e => setMedInput(e.target.value)} 
                        placeholder="e.g. Metformin, 500mg" 
                        onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addItem("current_medications", medInput, setMedInput))}
                        className="bg-zinc-50 border-zinc-100"
                    />
                    <Button type="button" onClick={() => addItem("current_medications", medInput, setMedInput)} className="shrink-0 bg-emerald-600 hover:bg-emerald-500">
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
                <div className="flex flex-wrap gap-2 min-h-6">
                    {medications.map((m: string) => (
                        <Badge key={m} variant="secondary" className="pl-3 pr-1 py-1 gap-1 text-zinc-600 bg-zinc-100 group">
                            {m}
                            <button type="button" onClick={() => removeItem("current_medications", m)} className="hover:text-rose-500 transition-colors">
                                <X className="w-3 h-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <Label className="text-zinc-900 font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    Drug Allergies
                </Label>
                <div className="flex gap-2">
                    <Input 
                        value={allergyInput} 
                        onChange={e => setAllergyInput(e.target.value)} 
                        placeholder="e.g. Penicillin" 
                        onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addItem("allergies", allergyInput, setAllergyInput))}
                        className="bg-zinc-50 border-zinc-100"
                    />
                    <Button type="button" onClick={() => addItem("allergies", allergyInput, setAllergyInput)} className="shrink-0 bg-emerald-600 hover:bg-emerald-500">
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
                <div className="flex flex-wrap gap-2 min-h-6">
                    {allergies.map((a: string) => (
                        <Badge key={a} variant="destructive" className="pl-3 pr-1 py-1 gap-1 text-rose-700 bg-rose-50 border-rose-100 group">
                            {a}
                            <button type="button" onClick={() => removeItem("allergies", a)} className="hover:text-rose-900 transition-colors">
                                <X className="w-3 h-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            </div>
        </div>
    )
}
