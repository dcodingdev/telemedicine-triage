"use client"

import { useState } from "react"
import { TriageForm } from "@/components/triage-form"
import { DoctorDashboard } from "@/components/doctor-dashboard"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function Home() {
    const [view, setView] = useState<"patient" | "doctor">("patient")

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-emerald-100/50 via-teal-50/20 to-transparent -z-10" />
            <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-rose-100/10 blur-[120px] -z-10 pointer-events-none" />
            
            <header className="px-6 py-4 flex items-center justify-between border-b border-zinc-100/50 backdrop-blur-sm sticky top-0 z-50 bg-white/30">
                <div className="flex items-center gap-3 group">
                    <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black group-hover:scale-110 transition-transform">
                        TT
                    </div>
                    <div>
                        <h1 className="font-bold text-xl tracking-tight text-zinc-900 group-hover:text-emerald-600 transition-colors">TeleTriage</h1>
                        <p className="text-[10px] text-zinc-500 font-medium tracking-[0.2em] uppercase">Healthcare Accelerated</p>
                    </div>
                </div>
                <div className="flex bg-zinc-100/50 p-1 rounded-full border border-zinc-200/50">
                    <Button 
                        size="sm" 
                        variant={view === "patient" ? "default" : "ghost"}
                        onClick={() => setView("patient")}
                        className={`rounded-full px-6 transition-all duration-300 ${view === 'patient' ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-500'}`}
                    >
                        Patient Form
                    </Button>
                    <Button 
                        size="sm" 
                        variant={view === "doctor" ? "default" : "ghost"}
                        onClick={() => setView("doctor")}
                        className={`rounded-full px-6 transition-all duration-300 ${view === 'doctor' ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-500'}`}
                    >
                        Doctor Portal
                    </Button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-16">
                <section className="flex flex-col lg:flex-row gap-16 items-start">
                    <div className="flex-1 space-y-8 py-10">
                        <Badge variant="outline" className="text-emerald-500 border-emerald-500 px-4 py-1 rounded-full bg-emerald-50/50">
                            v2.0 Beta • Integrated Pydantic Validation
                        </Badge>
                        <h2 className="text-5xl lg:text-7xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.1]">
                            The future of <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">Medical Triage.</span>
                        </h2>
                        <p className="text-xl text-zinc-500 dark:text-zinc-400 max-w-xl leading-relaxed">
                            Connecting patients with AI-powered triage analysis and live medical experts in under 60 seconds. Secure, HIPAA-compliant, and lightning fast.
                        </p>
                        
                        <div className="flex flex-wrap gap-12 pt-8">
                            <div>
                                <p className="text-4xl font-bold">99.2%</p>
                                <p className="text-sm text-zinc-500 font-medium">Accuracy Rate</p>
                            </div>
                            <div>
                                <p className="text-4xl font-bold">~45s</p>
                                <p className="text-sm text-zinc-500 font-medium">Average Triage Time</p>
                            </div>
                            <div>
                                <p className="text-4xl font-bold">24/7</p>
                                <p className="text-sm text-zinc-500 font-medium">Doctor Availability</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full flex justify-center lg:justify-end">
                        {view === "patient" ? <TriageForm /> : <DoctorDashboard />}
                    </div>
                </section>

                <section className="mt-32 border-t border-zinc-100 py-20">
                    <h3 className="text-center text-sm font-semibold tracking-widest text-zinc-400 uppercase mb-12">Built with Next.js 15 + FastAPI</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-40 grayscale group hover:opacity-100 hover:grayscale-0 transition-all duration-700">
                        <div className="flex items-center justify-center font-bold text-2xl">Modern UI</div>
                        <div className="flex items-center justify-center font-bold text-2xl">Tailwind 4</div>
                        <div className="flex items-center justify-center font-bold text-2xl">Pydantic v2</div>
                        <div className="flex items-center justify-center font-bold text-2xl">FastAPI Core</div>
                    </div>
                </section>
            </main>

            <footer className="py-12 border-t border-zinc-100 bg-zinc-50/50">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-zinc-500 text-sm">
                    <p>© 2026 TeleTriage Systems. All rights reserved.</p>
                    <div className="flex gap-8 mt-4 md:mt-0">
                        <a href="#" className="hover:text-emerald-600 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-emerald-600 transition-colors">Terms</a>
                        <a href="#" className="hover:text-emerald-600 transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    )
}
