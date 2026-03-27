"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

export function TriageForm() {
    const [step, setStep] = useState(1)
    
    return (
        <Card className="w-full max-w-lg border-none bg-white/80 shadow-2xl backdrop-blur-md dark:bg-zinc-900/80">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                        Patient Triage Form
                    </CardTitle>
                    <Badge variant="outline" className="border-emerald-500 text-emerald-600 dark:text-emerald-400">
                        Step {step} of 3
                    </Badge>
                </div>
                <CardDescription className="text-zinc-500 dark:text-zinc-400">
                    Please provide accurate information for a quick assessment.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {step === 1 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="first-name">First Name</Label>
                                <Input id="first-name" placeholder="John" className="bg-white/50 dark:bg-zinc-800/50" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="last-name">Last Name</Label>
                                <Input id="last-name" placeholder="Doe" className="bg-white/50 dark:bg-zinc-800/50" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="john.doe@example.com" className="bg-white/50 dark:bg-zinc-800/50" />
                        </div>
                    </div>
                )}
                {step === 2 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="space-y-2">
                            <Label htmlFor="symptoms">What are your primary symptoms?</Label>
                            <Input id="symptoms" placeholder="e.g. Fever, persistent cough, chest pain" className="bg-white/50 dark:bg-zinc-800/50" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="pain">Level of Pain (0-10)</Label>
                            <Input id="pain" type="number" min="0" max="10" defaultValue="0" className="bg-white/50 dark:bg-zinc-800/50" />
                        </div>
                    </div>
                )}
                {step === 3 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
                            <strong>Privacy Note:</strong> Your data is secure and will only be shared with licensed medical professionals.
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="history">Medical History (Optional)</Label>
                            <Input id="history" placeholder="Any pre-existing conditions..." className="bg-white/50 dark:bg-zinc-800/50" />
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-between border-t border-zinc-100 p-6 dark:border-zinc-800">
                <Button 
                    variant="ghost" 
                    onClick={() => setStep(Math.max(1, step - 1))}
                    disabled={step === 1}
                >
                    Back
                </Button>
                {step < 3 ? (
                    <Button 
                        className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                        onClick={() => setStep(step + 1)}
                    >
                        Next
                    </Button>
                ) : (
                    <Button className="bg-emerald-600 text-white hover:bg-emerald-500">
                        Submit for Triage
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}
