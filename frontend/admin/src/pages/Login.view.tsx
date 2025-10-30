import { type FormEvent, useState } from "react"
import { adminLogin } from "../features/auth/admin.api.ts"
import { Button, Input } from "@umnburrow/core"
import { useSetAtom } from "jotai"
import { useNavigate } from "react-router"
import { adminTokenAtom } from "../features/auth/admin.atom.ts"

export default function LoginView() {
    const nav = useNavigate()

    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [totp, setTotp] = useState("")
    const [remember, setRemember] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const setAdminToken = useSetAtom(adminTokenAtom)

    async function onSubmit(e: FormEvent) {
        e.preventDefault()
        setError(null)
        setSubmitting(true)

        try {
            const result = await adminLogin(username, password, totp)

            setAdminToken(result.token)

            nav("/admin/dashboard")
        } catch (err: any) {
            setError(err?.message ?? "Login failed")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-background text-text grid place-items-center p-6">
            <div className="w-full max-w-md">
                {/* Card */}
                <div className="rounded-2xl border border-card-border bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-sm overflow-hidden">
                    <div className="px-6 pt-6 pb-4">
                        <div className="flex items-center justify-center gap-3">
                            <h1 className="text-lg text-center font-semibold tracking-tight">
                                Burrow Administrative Portal
                            </h1>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-background" />

                    {/* Form */}
                    <form onSubmit={onSubmit} className="px-6 py-6 space-y-5">
                        {error && (
                            <div className="text-sm rounded-lg border border-red-600/40 bg-red-600/10 px-3 py-2 text-red-200">
                                {error}
                            </div>
                        )}

                        <Input
                            text={"Username"}
                            placeholder={"your username"}
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />

                        <Input
                            text={"Password"}
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />

                        <Input
                            text={"Authenticator Code"}
                            name="totp"
                            type="text"
                            inputMode="numeric"
                            pattern="\d*"
                            maxLength={8}
                            autoComplete="one-time-code"
                            placeholder="123456"
                            value={totp}
                            onChange={(e) => setTotp(e.target.value)}
                            required
                        />

                        <div className="flex items-center justify-between">
                            <label className="inline-flex items-center gap-2 text-sm text-gray-300">
                                <input
                                    type="checkbox"
                                    checked={remember}
                                    onChange={(e) =>
                                        setRemember(e.target.checked)
                                    }
                                    className="size-4 rounded accent-primary/90 border border-[rgb(var(--card-border-color))] bg-card"
                                />
                                Remember me
                            </label>
                            <a
                                href="#"
                                className="text-sm text-secondary hover:underline"
                            >
                                Forgot password?
                            </a>
                        </div>

                        <Button
                            type="submit"
                            color="PRIMARY"
                            className="w-full"
                            disabled={submitting}
                        >
                            Sign In
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}
