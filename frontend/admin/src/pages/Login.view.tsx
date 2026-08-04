import { getAdmin, login } from "@umnburrow/core/api"
import { useState } from "react"
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google"
import { useSetAtom } from "jotai"
import { useNavigate } from "react-router"
import {
    adminRefreshTokenAtom,
    adminTokenAtom
} from "../features/auth/admin.atom.ts"

export default function LoginView() {
    const nav = useNavigate()

    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const setAdminToken = useSetAtom(adminTokenAtom)
    const setRefreshToken = useSetAtom(adminRefreshTokenAtom)

    async function onGoogleSuccess(credential: string) {
        setError(null)
        setSubmitting(true)

        try {
            const result = await login(credential, "Admin Panel")

            // ensure the account actually has admin access before storing
            await getAdmin().catch(() => {
                throw new Error(
                    "This account does not have administrator access."
                )
            })

            setAdminToken(result.token)
            setRefreshToken(result.refreshToken)

            nav("/dashboard")
        } catch (err) {
            setError((err as Error)?.message ?? "Login failed")
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

                    {/* Sign in */}
                    <div className="px-6 py-8 space-y-5">
                        {error && (
                            <div className="text-sm rounded-lg border border-red-600/40 bg-red-600/10 px-3 py-2 text-red-200">
                                {error}
                            </div>
                        )}

                        <p className="text-sm text-center text-muted-foreground">
                            Sign in with your Burrow account. Administrator
                            access is required.
                        </p>

                        <div className="flex justify-center">
                            {submitting ? (
                                <div className="text-sm text-muted-foreground">
                                    Signing in...
                                </div>
                            ) : (
                                <GoogleOAuthProvider
                                    clientId={
                                        import.meta.env.VITE_GOOGLE_CLIENT_ID ??
                                        ""
                                    }
                                >
                                    <GoogleLogin
                                        width={280}
                                        shape="pill"
                                        size="large"
                                        text="continue_with"
                                        onSuccess={(response) =>
                                            onGoogleSuccess(
                                                response.credential ?? ""
                                            )
                                        }
                                        onError={() =>
                                            setError(
                                                "Failed to authenticate with Google."
                                            )
                                        }
                                    />
                                </GoogleOAuthProvider>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
