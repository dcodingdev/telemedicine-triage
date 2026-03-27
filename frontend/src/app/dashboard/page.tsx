"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, User, ArrowRight } from "lucide-react"
import { apiClient } from "@/lib/api"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
    const [patients, setPatients] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const data = await apiClient.get("/patients")
                setPatients(data)
            } catch (err) {
                console.error("Failed to fetch patients", err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchPatients()
    }, [])

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Patient Dashboard</h2>
                    <p className="text-zinc-500">Manage triage profiles for yourself and your family</p>
                </div>
                <Button 
                    onClick={() => router.push("/dashboard/survey")}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 rounded-xl h-11 px-6 shadow-lg shadow-emerald-500/20"
                >
                    <Plus className="w-4 h-4" />
                    New Triage Request
                </Button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-white/60 border-none shadow-sm backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <Users className="w-5 h-5 text-emerald-600 mb-2" />
                        <CardTitle className="text-sm font-medium text-zinc-500">Active Profiles</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{patients.length}</p>
                    </CardContent>
                </Card>
                <Card className="bg-white/60 border-none shadow-sm backdrop-blur-sm">
                    <CardHeader className="pb-2">
                        <Activity className="w-5 h-5 text-amber-600 mb-2" />
                        <CardTitle className="text-sm font-medium text-zinc-500">Total Consultations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">0</p>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="w-5 h-5 text-zinc-400" />
                    Patient Profiles
                </h3>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-48 rounded-2xl bg-zinc-100 animate-pulse" />
                        ))}
                    </div>
                ) : patients.length === 0 ? (
                    <Card className="border-dashed border-2 bg-transparent text-center py-12">
                        <CardContent className="space-y-4">
                            <div className="mx-auto w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center">
                                <User className="w-6 h-6 text-zinc-400" />
                            </div>
                            <div className="space-y-1">
                                <p className="font-medium text-zinc-900">No profiles found</p>
                                <p className="text-sm text-zinc-500">Create a profile to start your first triage assessment</p>
                            </div>
                            <Button variant="outline" onClick={() => router.push("/dashboard/survey")} className="rounded-xl">
                                Create Profile
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {patients.map((patient) => (
                            <Card key={patient.id} className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-none bg-white shadow-sm overflow-hidden rounded-2xl">
                                <div className="h-2 bg-emerald-500/10 group-hover:bg-emerald-500 transition-colors" />
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                                            {patient.relation}
                                        </Badge>
                                        <p className="text-xs text-zinc-400">{new Date(patient.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <CardTitle className="text-xl pt-2">{patient.first_name} {patient.last_name}</CardTitle>
                                    <CardDescription>DOB: {new Date(patient.date_of_birth).toLocaleDateString()}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button variant="ghost" className="w-full justify-between items-center px-0 hover:bg-transparent group-hover:text-emerald-600">
                                        View History
                                        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function Activity({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    )
}
