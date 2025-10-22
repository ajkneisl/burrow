import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google"
import { useState } from "react"
import { useNavigate } from "react-router"
import { useAtom } from "jotai"
import toast from "react-hot-toast"
import type { AuthorizedUser } from "@features/auth/api/user.types.ts"
import {
    authToken,
    newUser,
    userDetails
} from "@features/auth/api/auth.atom.ts"
import { BASE_URL } from "@api/util.ts"
import Card from "@components/Card.tsx"

/**
 * Burrow landing page.
 */
export default function LandingView() {
    const nav = useNavigate()
    const [error, setError] = useState<string | null>(null)

    const [isNewUser, setNewUser] = useAtom(newUser)
    const [token, setAuthToken] = useAtom(authToken)
    const [, setUser] = useAtom(userDetails)

    async function attemptRegister(credentials: string) {
        const request = await fetch(`${BASE_URL}/user/login`, {
            method: "PUT",
            body: credentials
        })

        if (!request.ok) {
            setError(
                "There was an issue logging into your account. Please ensure it's an official UMN account!"
            )
            return
        }

        const body: AuthorizedUser = await request.json()

        await setAuthToken(body.token)
        setUser(body.user)

        if (body.newUser) {
            setNewUser(true)
            toast.success("Welcome to Burrow!")
        } else {
            toast.success("Welcome back to Burrow!")
        }

        nav("/")
    }

    if (token && !isNewUser) {
        nav("/")
    }

    return (
        <div className="flex flex-col items-center">
            {/* big gohher */}
            <div className="relative mt-8 w-full overflow-hidden rounded-2xl">
                <div className="h-[22rem] w-full bg-[url('/realgopher.png')] bg-[position:center_calc(100%+225px)]" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 text-center">
                    <h1 className="figtree text-7xl font-extrabold tracking-tight text-white drop-shadow-md">
                        Burrow
                    </h1>

                    <p className="mt-3 max-w-2xl px-4 text-lg text-white/90">
                        Discover peers, study better, and meet at the right
                        time.
                    </p>
                </div>
            </div>

            <div className="mx-auto mt-10 grid w-full max-w-5xl grid-cols-1 gap-4 px-4 md:grid-cols-3">
                <Card>
                    <div className="mb-2 flex items-center gap-2 font-semibold">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="h-5 w-5"
                        >
                            <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm1 14.59L9.7 13.29a1 1 0 1 1 1.4-1.42l1.3 1.3 3.5-3.5a1 1 0 0 1 1.4 1.42Z" />
                        </svg>
                        Find study groups
                    </div>
                    Search by course, topic, or club and see who’s active right
                    now.
                </Card>

                <Card>
                    <div className="mb-2 flex items-center gap-2 font-semibold">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="h-5 w-5"
                        >
                            <path d="M7 2h10a2 2 0 0 1 2 2v16l-7-3-7 3V4a2 2 0 0 1 2-2Z" />
                        </svg>
                        Smart, personal schedule
                    </div>
                    Burrow highlights times that fit your classes and existing
                    meetings.
                </Card>

                <Card>
                    <div className="mb-2 flex items-center gap-2 font-semibold">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="h-5 w-5"
                        >
                            <path d="M12 3a9 9 0 1 0 9 9 9.01 9.01 0 0 0-9-9Zm1 5h-2v5h5v-2h-3Z" />
                        </svg>
                        Join in seconds
                    </div>
                    Use your UMN Google account to sign in and you’re ready to
                    go.
                </Card>
            </div>

            {/* if there's an error logging in*/}
            {error && (
                <div
                    className="mx-auto mt-6 w-full max-w-lg px-4"
                    aria-live="polite"
                >
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                </div>
            )}

            {/* log in area */}
            <div className="mx-auto mt-12 mb-12 flex w-full max-w-lg flex-col items-center px-4">
                <h2 className="text-center text-xl font-semibold">
                    Sign in with your University of Minnesota account
                </h2>

                <div className="mt-5">
                    <Card>
                        <div className="flex flex-col items-center gap-3 max-w-screen">
                            <GoogleOAuthProvider clientId="808386876282-4s7060hmt21b2i069tkea6fddsumj86o.apps.googleusercontent.com">
                                <GoogleLogin
                                    shape="pill"
                                    size="large"
                                    text="continue_with"
                                    theme="filled_blue"
                                    onSuccess={(response) =>
                                        attemptRegister(
                                            response.credential ?? ""
                                        )
                                    }
                                    onError={() =>
                                        console.log("failure failure :(")
                                    }
                                />
                            </GoogleOAuthProvider>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
