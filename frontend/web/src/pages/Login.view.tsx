import { useState } from "react"
import { useNavigate } from "react-router"
import { useAtom, useSetAtom } from "jotai"
import toast from "react-hot-toast"
import { useMutation } from "@tanstack/react-query"
import { ArrowLeft, ArrowRight, AlertTriangle } from "lucide-react"
import { authToken, userDetails } from "@features/auth/auth.atom.ts"
import { altLogin } from "@features/auth/user.api.ts"
import { Link } from "react-router"

/**
 * Alternative sign-in page with username and password.
 *
 * @author AJ Kneisl
 */
export default function Login() {
    const nav = useNavigate()

    const [auth, setAuthToken] = useAtom(authToken)
    const setUser = useSetAtom(userDetails)

    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")

    const loginMutation = useMutation({
        mutationFn: () => altLogin(username.trim(), password),

        onSuccess: (data) => {
            setAuthToken(data.token)
            setUser(data.user)

            toast.success("Welcome back!")
            nav("/")
        },

        onError: (error: Error) => {
            toast.error(error.message || "Invalid username or password.")
        }
    })

    if (auth && auth !== "") {
        nav("/")
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!username.trim() || !password.trim()) {
            toast.error("Please enter both username and password.")
            return
        }

        loginMutation.mutate()
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-4">
            <div className="w-full max-w-md space-y-4">
                {/* back */}
                <Link
                    to="/welcome"
                    className="text-text/60 hover:text-text group -mb-4 inline-flex items-center gap-2 text-sm font-medium transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                    Back to Welcome
                </Link>

                {/* header */}
                <div>
                    <h1 className="text-text text-3xl font-bold">
                        Alternative Sign In
                    </h1>
                </div>

                {/* warning */}
                <div className="flex gap-3 rounded-lg border border-red-800/30 bg-red-500/10 p-4">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-400" />
                    <div className="text-sm">
                        <p className="text-text mb-1 font-semibold">Note</p>
                        <p className="text-text/80">
                            If you're a student, please use the{" "}
                            <span className="font-semibold">
                                "Sign in with Google"
                            </span>{" "}
                            button on the{" "}
                            <Link
                                to="/welcome"
                                className="text-secondary font-medium hover:underline"
                            >
                                welcome page
                            </Link>
                            .
                        </p>
                    </div>
                </div>

                {/* form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="text-text mb-2 block text-sm font-semibold">
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your username"
                            disabled={loginMutation.isPending}
                            autoComplete="username"
                            className="w-full rounded-lg border border-card-border bg-card px-4 py-3 text-base text-text outline-none transition-colors placeholder:text-text/40 focus:border-secondary"
                        />
                    </div>

                    <div>
                        <label className="text-text mb-2 block text-sm font-semibold">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            disabled={loginMutation.isPending}
                            autoComplete="current-password"
                            className="w-full rounded-lg border border-card-border bg-card px-4 py-3 text-base text-text outline-none transition-colors placeholder:text-text/40 focus:border-secondary"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loginMutation.isPending}
                        className="bg-secondary hover:bg-secondary/90 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-semibold text-white transition-colors disabled:opacity-50"
                    >
                        {loginMutation.isPending ? "Signing in..." : "Sign In"}
                        {!loginMutation.isPending && (
                            <ArrowRight className="h-4 w-4" />
                        )}
                    </button>
                </form>

                {/* help */}
                <p className="text-text/60 text-center text-sm">
                    Need help? Contact us at{" "}
                    <span className="font-mono">support@umn.app</span>.
                </p>
            </div>
        </div>
    )
}
