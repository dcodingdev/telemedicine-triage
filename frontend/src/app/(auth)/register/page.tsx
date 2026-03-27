"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { registerSchema } from "@/lib/validations"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api"
import { useState } from "react"
import Link from "next/link"

export default function RegisterPage() {
    const { login } = useAuth()
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    const form = useForm({
        resolver: zodResolver(registerSchema),
        defaultValues: { email: "", password: "", first_name: "", last_name: "" }
    })

    const onSubmit = async (values: any) => {
        setIsLoading(true)
        setError(null)
        try {
            const data = await apiClient.post("/auth/register", values)
            login(data.access_token, data.user)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card className="border-none bg-white/80 shadow-2xl backdrop-blur-md dark:bg-zinc-900/80">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold tracking-tight">Create Account</CardTitle>
                <CardDescription>Join TeleTriage for instant medical assistance</CardDescription>
            </CardHeader>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="p-3 rounded-lg bg-rose-50 text-rose-600 text-sm border border-rose-100">
                            {error}
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="first_name">First Name</Label>
                            <Input 
                                id="first_name" 
                                placeholder="John"
                                {...form.register("first_name")}
                                className="bg-white/50 dark:bg-zinc-800/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="last_name">Last Name</Label>
                            <Input 
                                id="last_name" 
                                placeholder="Doe"
                                {...form.register("last_name")}
                                className="bg-white/50 dark:bg-zinc-800/50"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                            id="email" 
                            type="email" 
                            placeholder="m@example.com"
                            {...form.register("email")}
                            className="bg-white/50 dark:bg-zinc-800/50"
                        />
                        {form.formState.errors.email && (
                            <p className="text-xs text-rose-500">{form.formState.errors.email.message as string}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input 
                            id="password" 
                            type="password"
                            {...form.register("password")}
                            className="bg-white/50 dark:bg-zinc-800/50"
                        />
                        {form.formState.errors.password && (
                            <p className="text-xs text-rose-500">{form.formState.errors.password.message as string}</p>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                    <Button 
                        type="submit" 
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white"
                        disabled={isLoading}
                    >
                        {isLoading ? "Creating Account..." : "Create Account"}
                    </Button>
                    <p className="text-sm text-center text-zinc-500 font-medium">
                        Already have an account?{" "}
                        <Link href="/login" className="text-emerald-600 hover:underline">Sign In</Link>
                    </p>
                </CardFooter>
            </form>
        </Card>
    )
}
