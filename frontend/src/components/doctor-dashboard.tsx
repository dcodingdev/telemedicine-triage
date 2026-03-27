"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const triageItems = [
    { id: "TR-123", patient: "Jane Doe", symptoms: ["Chest pain", "Shortness of breath"], level: "critical", time: "2m ago" },
    { id: "TR-124", patient: "Mark Smith", symptoms: ["High fever", "Sore throat"], level: "high", time: "15m ago" },
    { id: "TR-125", patient: "Lucy Brown", symptoms: ["Mild cough", "Fatigue"], level: "low", time: "1h ago" },
]

export function DoctorDashboard() {
    return (
        <div className="w-full space-y-6">
            <header className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Doctor Dashboard
                </h1>
                <Badge variant="outline" className="text-emerald-500 border-emerald-500">
                    Live Updates Active
                </Badge>
            </header>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900">
                    <CardHeader className="p-4">
                        <CardTitle className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Total Requests</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-50">242</p>
                    </CardContent>
                </Card>
                <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900">
                    <CardHeader className="p-4">
                        <CardTitle className="text-sm font-medium text-amber-800 dark:text-amber-300">Pending Triage</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <p className="text-2xl font-bold text-amber-900 dark:text-amber-50">12</p>
                    </CardContent>
                </Card>
                <Card className="bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900">
                    <CardHeader className="p-4">
                        <CardTitle className="text-sm font-medium text-rose-800 dark:text-rose-300">Critical Cases</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <p className="text-2xl font-bold text-rose-900 dark:text-rose-50">3</p>
                    </CardContent>
                </Card>
            </div>

            <div className="rounded-xl border border-zinc-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50">
                <div className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Incoming Queries</h2>
                    <div className="space-y-4">
                        {triageItems.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 transition-colors">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold">{item.patient}</p>
                                        <Badge 
                                            variant={item.level === 'critical' ? 'destructive' : 'secondary'}
                                            className="text-[10px] uppercase font-bold"
                                        >
                                            {item.level}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                        Symptoms: {item.symptoms.join(", ")}
                                    </p>
                                </div>
                                <div className="text-right space-y-2">
                                    <p className="text-xs text-zinc-400 font-mono">{item.time}</p>
                                    <Button size="sm" variant="outline" className="h-8">Details</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
