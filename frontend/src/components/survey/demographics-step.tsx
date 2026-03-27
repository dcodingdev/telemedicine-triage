"use client"

import { useFormContext } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

export default function DemographicsStep() {
    const { register, setValue, watch, formState: { errors } } = useFormContext()
    const sexAtBirth = watch("sex_at_birth")

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>First Name</Label>
                    <Input {...register("first_name")} placeholder="John" className="bg-zinc-50 border-zinc-100" />
                </div>
                <div className="space-y-2">
                    <Label>Last Name</Label>
                    <Input {...register("last_name")} placeholder="Doe" className="bg-zinc-50 border-zinc-100" />
                </div>
            </div>

            <div className="space-y-4">
                <Label>Date of Birth</Label>
                <Input {...register("date_of_birth")} type="date" className="bg-zinc-50 border-zinc-100" />
            </div>

            <Separator className="bg-zinc-50" />

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Age</Label>
                    <Input {...register("age", { valueAsNumber: true })} type="number" className="bg-zinc-50 border-zinc-100" />
                </div>
                <div className="space-y-2">
                    <Label>Sex at Birth</Label>
                    <Select onValueChange={(val) => setValue("sex_at_birth", val)} value={sexAtBirth}>
                        <SelectTrigger className="bg-zinc-50 border-zinc-100">
                            <SelectValue placeholder="Select sex" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                    <Label>Height (cm)</Label>
                    <Input {...register("height_cm")} placeholder="180" className="bg-zinc-50 border-zinc-100" />
                </div>
                <div className="space-y-2">
                    <Label>Weight (kg)</Label>
                    <Input {...register("weight_kg")} placeholder="75" className="bg-zinc-50 border-zinc-100" />
                </div>
            </div>
        </div>
    )
}
