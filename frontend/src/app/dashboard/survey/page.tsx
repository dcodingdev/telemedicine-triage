"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { demographicsSchema, baselineSchema, complaintSchema } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Check } from "lucide-react"

// Import steps (we will create these next)
import DemographicsStep from "@/components/survey/demographics-step"
import BaselineStep from "@/components/survey/baseline-step"
import ComplaintStep from "@/components/survey/complaint-step"
import ReviewStep from "@/components/survey/review-step"
import { apiClient } from "@/lib/api"

export default function SurveyPage() {
    const [step, setStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()

    const methods = useForm({
        mode: "onChange",
        defaultValues: {
            // Step 1
            age: 0,
            sex_at_birth: "male",
            height_cm: "",
            weight_kg: "",
            // Step 2
            chronic_conditions: [],
            allergies: [],
            current_medications: [],
            // Step 3 & 4 (Risk + Complaint)
            chief_complaint: "",
            symptom_onset: "",
            smoker: false,
            alcohol_use: "none",
            pregnancy_status: false,
            // Header Info (temp for this demo)
            first_name: "",
            last_name: "",
            date_of_birth: "",
            relation: "self"
        }
    })

    const nextStep = async () => {
        let isValid = false
        if (step === 1) isValid = await methods.trigger(["age", "sex_at_birth"])
        else if (step === 2) isValid = await methods.trigger(["chronic_conditions", "allergies", "current_medications"])
        else if (step === 3) isValid = await methods.trigger(["chief_complaint", "symptom_onset", "smoker", "alcohol_use"])
        
        if (isValid || step === 4) {
            setStep(s => Math.min(s + 1, 4))
        }
    }

    const prevStep = () => setStep(s => Math.max(s - 1, 1))

    const onSubmit = async (data: any) => {
        setIsSubmitting(true)
        try {
            // 1. Create Patient
            const patientData = {
                first_name: data.first_name || "Self",
                last_name: data.last_name || "Patient",
                date_of_birth: data.date_of_birth || "2000-01-01",
                relation: data.relation || "self",
                history: {
                    chronic_conditions: data.chronic_conditions,
                    allergies: data.allergies,
                    current_medications: data.current_medications
                }
            }
            const patient = await apiClient.post("/patients", patientData)

            // 2. Submit Survey
            const surveyData = {
                patient_id: patient.id,
                demographics: {
                    age: data.age,
                    sex_at_birth: data.sex_at_birth,
                    height_cm: data.height_cm ? parseFloat(data.height_cm) : null,
                    weight_kg: data.weight_kg ? parseFloat(data.weight_kg) : null
                },
                medical_baseline: patientData.history,
                risk_profile: {
                    smoker: data.smoker,
                    alcohol_use: data.alcohol_use,
                    pregnancy_status: data.pregnancy_status
                },
                chief_complaint: data.chief_complaint,
                symptom_onset: data.symptom_onset || null
            }
            await apiClient.post("/surveys", surveyData)
            
            // Redirect to voice triage (Phase 2) with patient ID
            router.push(`/dashboard/voice-triage?patient_id=${patient.id}`)
        } catch (err) {
            console.error(err)
            alert("Failed to submit survey")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto py-10 px-4">
            <div className="mb-8 space-y-4">
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-2xl font-bold text-zinc-900 leading-tight">Medical Intake Survey</h2>
                        <p className="text-zinc-500">Provide details for a clinical assessment</p>
                    </div>
                    <Badge variant="outline" className="h-6 border-emerald-500 text-emerald-600 font-bold px-3">
                        Step {step} of 4
                    </Badge>
                </div>
                <div className="space-y-2">
                    <Progress value={(step / 4) * 100} className="h-2 bg-zinc-100" />
                    <div className="flex justify-between text-[10px] uppercase tracking-widest font-black text-zinc-400">
                        <span className={step >= 1 ? "text-emerald-600" : ""}>Identity</span>
                        <span className={step >= 2 ? "text-emerald-600" : ""}>Baseline</span>
                        <span className={step >= 3 ? "text-emerald-600" : ""}>Incident</span>
                        <span className={step >= 4 ? "text-emerald-600" : ""}>Review</span>
                    </div>
                </div>
            </div>

            <Card className="border-none bg-white shadow-2xl shadow-emerald-500/5 rounded-3xl overflow-hidden">
                <FormProvider {...methods}>
                    <form onSubmit={methods.handleSubmit(onSubmit)}>
                        <CardHeader className="border-b border-zinc-50 bg-zinc-50/10 p-8">
                            <CardTitle className="text-xl">
                                {step === 1 && "Demographics"}
                                {step === 2 && "Medical history"}
                                {step === 3 && "Reason for Visit"}
                                {step === 4 && "Final Review"}
                            </CardTitle>
                            <CardDescription>
                                {step === 1 && "Start with basic information for identification."}
                                {step === 2 && "Help us understand your clinical background."}
                                {step === 3 && "Tell us why you are seeking assistance today."}
                                {step === 4 && "Verify your information before submission."}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="p-8">
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                {step === 1 && <DemographicsStep />}
                                {step === 2 && <BaselineStep />}
                                {step === 3 && <ComplaintStep />}
                                {step === 4 && <ReviewStep />}
                            </div>
                        </CardContent>

                        <CardFooter className="bg-zinc-50/50 p-8 flex justify-between border-t border-zinc-100">
                            <Button 
                                type="button" 
                                variant="ghost" 
                                onClick={prevStep} 
                                disabled={step === 1}
                                className="rounded-xl px-6 h-12"
                            >
                                <ChevronLeft className="w-4 h-4 mr-2" />
                                Back
                            </Button>
                            
                            {step < 4 ? (
                                <Button 
                                    type="button" 
                                    onClick={nextStep}
                                    className="bg-zinc-900 text-white rounded-xl px-8 h-12 hover:bg-zinc-800 transition-all font-semibold"
                                >
                                    Next Step
                                    <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            ) : (
                                <Button 
                                    type="submit" 
                                    disabled={isSubmitting}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-10 h-12 shadow-lg shadow-emerald-500/20 font-bold"
                                >
                                    {isSubmitting ? "Submitting..." : "Submit Case"}
                                    <Check className="w-4 h-4 ml-2" />
                                </Button>
                            )}
                        </CardFooter>
                    </form>
                </FormProvider>
            </Card>
        </div>
    )
}
