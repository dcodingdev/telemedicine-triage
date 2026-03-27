"use client"

import React, { useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LogOut, User as UserIcon, Home, Activity, Mic } from "lucide-react"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, logout, isLoading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        if (!isLoading && !user) {
            router.push("/login")
        }
    }, [user, isLoading, router])

    if (isLoading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans selection:bg-emerald-100 selection:text-emerald-900 flex flex-col">
            <header className="px-6 py-4 flex items-center justify-between border-b border-zinc-100/50 backdrop-blur-sm sticky top-0 z-50 bg-white/30">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/dashboard")}>
                    <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black">
                        TT
                    </div>
                    <h1 className="font-bold text-xl tracking-tight text-zinc-900">TeleTriage</h1>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/50 border border-zinc-200 rounded-full">
                        <UserIcon className="w-4 h-4 text-zinc-500" />
                        <span className="text-sm font-medium text-zinc-700">{user.first_name} {user.last_name}</span>
                        <Badge variant="secondary" className="text-[10px] uppercase font-bold px-1.5 h-4 bg-emerald-100 text-emerald-700 border-none">
                            {user.role}
                        </Badge>
                    </div>
                    <Button variant="ghost" size="icon" onClick={logout} className="rounded-full text-zinc-500 hover:text-rose-500 hover:bg-rose-50">
                        <LogOut className="w-5 h-5" />
                    </Button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                <aside className="w-64 border-r border-zinc-100 bg-white/30 hidden lg:flex flex-col p-6 gap-2">
                    <Button 
                        variant={pathname === "/dashboard" ? "secondary" : "ghost"} 
                        className="justify-start gap-3 rounded-xl h-12 px-4"
                        onClick={() => router.push("/dashboard")}
                    >
                        <Home className="w-5 h-5" />
                        Dashboard
                    </Button>
                    <Button 
                        variant={pathname.includes("/survey") ? "secondary" : "ghost"} 
                        className="justify-start gap-3 rounded-xl h-12 px-4"
                        onClick={() => router.push("/dashboard/survey")}
                    >
                        <Activity className="w-5 h-5" />
                        New Triage
                    </Button>
                    <Button 
                        variant={pathname.includes("/voice-triage") ? "secondary" : "ghost"} 
                        className="justify-start gap-3 rounded-xl h-12 px-4"
                        onClick={() => router.push("/dashboard/voice-triage")}
                    >
                        <Mic className="w-5 h-5" />
                        Voice Triage
                    </Button>
                </aside>
                
                <main className="flex-1 overflow-y-auto p-6 md:p-10">
                    <div className="max-w-5xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
