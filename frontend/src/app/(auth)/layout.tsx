"use client"

import React from "react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden flex flex-col">
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-emerald-100/50 via-teal-50/20 to-transparent -z-10" />
            <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-rose-100/10 blur-[120px] -z-10 pointer-events-none" />
            
            <header className="px-6 py-4 flex items-center justify-between border-b border-zinc-100/50 backdrop-blur-sm sticky top-0 z-50 bg-white/30">
                <Link href="/" className="flex items-center gap-3 cursor-pointer group">
                    <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-black group-hover:scale-105 transition-transform">
                        TT
                    </div>
                    <div>
                        <h1 className="font-bold text-xl tracking-tight text-zinc-900 group-hover:text-emerald-600 transition-colors">TeleTriage</h1>
                    </div>
                </Link>
                <Badge variant="outline" className="text-emerald-500 border-emerald-500">Secure Access</Badge>
            </header>

            <main className="flex-1 flex items-center justify-center p-6 relative">
                <div className="w-full max-w-md">
                    {children}
                </div>
            </main>
        </div>
    )
}
