import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google"
import { useLayoutEffect, useRef, useState } from "react"
import { useNavigate } from "react-router"
import { useAtom, useSetAtom } from "jotai"
import toast from "react-hot-toast"
import { useMutation } from "@tanstack/react-query"
import { Users, CalendarClock, Sparkles } from "lucide-react"
import { authToken, newUser, userDetails } from "@features/auth/auth.atom.ts"
import { Card, ViewErrors } from "@umnburrow/core"
import { login } from "@features/auth/user.api.ts"

/**
 * The view people get when first visiting Burrow.
 *
 * @author AJ Kneisl
 */
export default function LandingView() {
    const nav = useNavigate()

    const googleLoginContainer = useRef<HTMLDivElement>(null)
    const [error, setError] = useState<string | null>()

    const [googleLoginWidth, setGoogleLoginWidth] = useState(
        (googleLoginContainer?.current?.clientWidth ?? 128) - 16
    )

    // update the size of the google login depending on it's parent
    useLayoutEffect(() => {
        function onSizeChange() {
            setGoogleLoginWidth(
                (googleLoginContainer?.current?.clientWidth ?? 128) - 16
            )
        }

        onSizeChange()

        window.addEventListener("resize", onSizeChange)
        return () => window.removeEventListener("resize", onSizeChange)
    }, [])

    const [auth, setAuthToken] = useAtom(authToken)
    const setNewUser = useSetAtom(newUser)
    const setUser = useSetAtom(userDetails)

    // login
    const loginMutation = useMutation({
        mutationFn: login,

        onSuccess: (data) => {
            void setAuthToken(data.token)
            void setUser(data.user)

            if (data.newUser) {
                setNewUser(true)

                toast.success("Welcome to Burrow!")
            } else {
                toast.success("Welcome back to Burrow!")
            }

            nav("/")
        },

        onError: (error: Error) => {
            setError(`${error}`)
        }
    })

    if (auth && auth !== "") {
        nav("/")
    }

    return (
        <div className="flex flex-col items-center">
            {/* Big Gopher */}
            <div className="relative mt-8 w-full max-w-6xl overflow-hidden rounded-2xl">
                <div className="h-[22rem] bg-[url('/image/banner.png')] bg-[position:center_calc(100%+225px)] bg-no-repeat" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 text-center">
                    <h1 className="figtree text-secondary text-7xl font-extrabold tracking-tight drop-shadow-md">
                        Burrow
                    </h1>

                    <p className="mt-3 max-w-2xl px-4 text-lg text-white/90">
                        Discover peers, study better, and meet at the right
                        time.
                    </p>
                </div>
            </div>

            <div className="mx-auto mt-10 grid w-full max-w-5xl grid-cols-1 gap-6 px-4 md:grid-cols-3">
                <Card className="group transition-all hover:shadow-lg">
                    <div className="mb-3 flex items-center gap-3">
                        <div className="bg-secondary/10 text-secondary flex h-10 w-10 items-center justify-center rounded-lg transition-transform group-hover:scale-110">
                            <Users className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-bold">
                            Connect with peers
                        </h3>
                    </div>
                    <p className="text-text/70 text-sm leading-relaxed">
                        Discover and join study sessions with students in your
                        courses. Find the perfect study group that fits your
                        schedule.
                    </p>
                </Card>

                <Card className="group transition-all hover:shadow-lg">
                    <div className="mb-3 flex items-center gap-3">
                        <div className="bg-secondary/10 text-secondary flex h-10 w-10 items-center justify-center rounded-lg transition-transform group-hover:scale-110">
                            <CalendarClock className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-bold">Smart scheduling</h3>
                    </div>
                    <p className="text-text/70 text-sm leading-relaxed">
                        Burrow ensures everyone stays in sync and on the same
                        schedule. No more back and forth.
                    </p>
                </Card>

                <Card className="group transition-all hover:shadow-lg">
                    <div className="mb-3 flex items-center gap-3">
                        <div className="bg-secondary/10 text-secondary flex h-10 w-10 items-center justify-center rounded-lg transition-transform group-hover:scale-110">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-bold">Instant access</h3>
                    </div>
                    <p className="text-text/70 text-sm leading-relaxed">
                        Sign in with your UMN Google account and start
                        collaborating immediately. Built exclusively for
                        Gophers.
                    </p>
                </Card>
            </div>

            {/* log in area */}
            <div className="mx-4 mt-12 mb-12 flex w-full max-w-lg flex-col items-center px-4">
                <h2 className="text-center text-xl font-semibold">
                    Sign in with your University of Minnesota account
                </h2>

                <div className="mt-5">
                    {error && (
                        <ViewErrors
                            errors={[error]}
                            clearErrors={() => setError(null)}
                        />
                    )}

                    <Card>
                        <div
                            ref={googleLoginContainer}
                            className="flex max-w-screen flex-col items-center gap-3"
                        >
                            <GoogleOAuthProvider clientId="808386876282-4s7060hmt21b2i069tkea6fddsumj86o.apps.googleusercontent.com">
                                <GoogleLogin
                                    width={googleLoginWidth}
                                    shape="pill"
                                    size="large"
                                    text="continue_with"
                                    theme="filled_blue"
                                    onSuccess={(response) =>
                                        loginMutation.mutate(
                                            response.credential ?? ""
                                        )
                                    }
                                    onError={() => {
                                        toast.error(
                                            "Failed to authenticate with Google"
                                        )
                                    }}
                                />
                            </GoogleOAuthProvider>
                        </div>
                    </Card>

                    <p className="text-text/40 mt-3 text-center text-xs">
                        By signing in with Google, you agree to Burrow's{" "}
                        <a
                            href="/privacy"
                            className="text-text/60 hover:text-text/50 underline"
                        >
                            Privacy Policy
                        </a>{" "}
                        and{" "}
                        <a
                            href="/tos"
                            className="text-text/60 hover:text-text/50 underline"
                        >
                            Terms of Service
                        </a>
                        .
                    </p>
                </div>
            </div>
        </div>
    )
}
