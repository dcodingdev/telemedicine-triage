"use client"

import { useFormContext } from "react-hook-form"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { HelpCircle, History } from "lucide-react"

export default function ComplaintStep() {
    const { register, setValue, watch } = useFormContext()
    const alcoholUse = watch("alcohol_use")

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-4">
                <Label className="text-zinc-900 font-bold flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-emerald-600" />
                    Chief Complaint
                </Label>
                <Textarea 
                    {...register("chief_complaint")} 
                    placeholder="Describe your symptoms and visit reason in detail..."
                    className="min-h-[120px] bg-zinc-50 border-zinc-100 placeholder:text-zinc-400 focus:bg-white transition-all rounded-2xl p-4"
                />
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                    <Label className="text-zinc-900 font-bold flex items-center gap-2">
                        <History className="w-4 h-4 text-emerald-600" />
                        Symptom Onset
                    </Label>
                    <Input {...register("symptom_onset")} type="date" className="bg-zinc-50 border-zinc-100 rounded-xl" />
                </div>
                <div className="space-y-4">
                    <Label className="text-zinc-900 font-bold">Alcohol Use</Label>
                    <Select onValueChange={(val) => setValue("alcohol_use", val)} value={alcoholUse}>
                        <SelectTrigger className="bg-zinc-50 border-zinc-100 rounded-xl h-11">
                            <SelectValue placeholder="Select use" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-zinc-200">
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="occasional">Occasional</SelectItem>
                            <SelectItem value="frequent">Frequent</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Separator className="bg-zinc-50" />

            <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50/50 border border-zinc-100">
                <div className="space-y-0.5">
                    <Label className="text-zinc-900 font-bold">Currently Smoking?</Label>
                    <p className="text-xs text-zinc-500">Do you smoke cigarettes or use nicotine?</p>
                </div>
                <Checkbox 
                    onCheckedChange={(val) => setValue("smoker", val)} 
                    checked={watch("smoker")}
                    className="h-6 w-6 border-zinc-300 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-none"
                />
            </div>

            {watch("sex_at_birth") === "female" && (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50/20 border border-rose-100/50">
                    <div className="space-y-0.5">
                        <Label className="text-rose-900 font-bold">Currently Pregnant?</Label>
                        <p className="text-xs text-rose-500 font-medium">Relevant for medical triage assessment</p>
                    </div>
                    <Checkbox 
                        onCheckedChange={(val) => setValue("pregnancy_status", val)}
                        checked={watch("pregnancy_status")}
                        className="h-6 w-6 border-rose-200 data-[state=checked]:bg-rose-500 data-[state=checked]:border-none"
                    />
                </div>
            )}
        </div>
    )
}
