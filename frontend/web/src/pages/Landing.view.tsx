import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google"
import { useLayoutEffect, useRef, useState } from "react"
import { useNavigate } from "react-router"
import { useAtom, useSetAtom } from "jotai"
import toast from "react-hot-toast"
import { useMutation } from "@tanstack/react-query"
import {
    Users,
    CalendarClock,
    Sparkles,
    MessageSquare,
    Shield,
    Zap,
    ArrowRight,
    CheckCircle2
} from "lucide-react"
import { authToken, newUser, userDetails } from "@features/auth/auth.atom.ts"
import { ViewErrors } from "@umnburrow/core"
import { login } from "@features/auth/user.api.ts"
import { Link } from "react-router"

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
            setAuthToken(data.token)
            setUser(data.user)

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
        <div className="flex min-h-screen flex-col">
            <section className="relative overflow-hidden px-4 py-16 sm:py-16">
                <div className="mx-auto max-w-6xl space-y-8">
                    {/* made by gophers */}
                    <div className="flex justify-center">
                        <div className="bg-secondary/10 text-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium">
                            <img
                                src="/image/M_gold.svg"
                                alt="University of Minnesota"
                                className="h-5 w-5"
                            />
                            Made by Gophers, for Gophers
                        </div>
                    </div>

                    {/* banner */}
                    <div className="relative flex items-center justify-center">
                        <div className="border-card-border relative w-full max-w-5xl overflow-hidden rounded-2xl border shadow-2xl">
                            <div className="h-[400px] bg-[url('/image/banner.png')] bg-cover bg-center sm:h-[500px]" />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                            {/* study groups, made simple */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
                                <h1 className="figtree mb-6 text-5xl leading-tight font-extrabold tracking-tight text-white drop-shadow-lg sm:text-6xl md:text-7xl lg:text-8xl">
                                    Study groups,
                                    <br />
                                    <span className="from-secondary via-error to-secondary bg-gradient-to-r bg-clip-text text-transparent drop-shadow-sm">
                                        made simple
                                    </span>
                                </h1>

                                <p className="mx-auto max-w-2xl text-lg font-medium text-white drop-shadow-md sm:text-xl md:text-2xl">
                                    Connect with classmates, join study
                                    sessions, and ace your courses together. All
                                    in one place.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* trust indicators */}
                    <div className="text-text/60 flex flex-wrap items-center justify-center gap-6 text-sm">
                        <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="text-secondary h-4 w-4" />
                            <span>All Majors</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="text-secondary h-4 w-4" />
                            <span>Secure & Private</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="text-secondary h-4 w-4" />
                            <span>Completely Free</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* how it works */}
            <section className="bg-card/30 px-4 py-24 sm:px-6">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-16 text-center">
                        <h2 className="text-text mb-4 text-3xl font-bold sm:text-4xl md:text-5xl">
                            How it works
                        </h2>

                        <p className="text-text/80 mx-auto max-w-2xl text-lg font-medium">
                            Getting started is easier than finding a parking
                            spot on campus
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
                        {/* Step 1 */}
                        <div className="flex flex-col items-center text-center">
                            <div className="from-secondary/20 to-secondary/10 mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br">
                                <span className="text-secondary text-3xl font-bold">
                                    1
                                </span>
                            </div>
                            <h3 className="text-text mb-3 text-xl font-bold">
                                Sign in with Google
                            </h3>
                            <p className="text-text/80 text-base">
                                Use your UMN email to instantly join. No setup,
                                no hassle.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div className="flex flex-col items-center text-center">
                            <div className="from-secondary/20 to-secondary/10 mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br">
                                <span className="text-secondary text-3xl font-bold">
                                    2
                                </span>
                            </div>
                            <h3 className="text-text mb-3 text-xl font-bold">
                                Find or create a Burrow
                            </h3>
                            <p className="text-text/80 text-base">
                                Browse study groups for your classes or start
                                your own in seconds.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div className="flex flex-col items-center text-center">
                            <div className="from-secondary/20 to-secondary/10 mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br">
                                <span className="text-secondary text-3xl font-bold">
                                    3
                                </span>
                            </div>
                            <h3 className="text-text mb-3 text-xl font-bold">
                                Start collaborating
                            </h3>
                            <p className="text-text/80 text-base">
                                Study with classmates, work together on a
                                project, or simply meet new people.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* features */}
            <section className="bg-background px-4 py-24 sm:px-6">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-16 text-center">
                        <h2 className="text-text mb-4 text-3xl font-bold sm:text-4xl md:text-5xl">
                            Everything you need, nothing you don't
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="flex gap-4">
                            <div className="bg-secondary/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                                <Users className="text-secondary h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-text mb-1 font-semibold">
                                    Browse study groups
                                </h3>
                                <p className="text-text/75 text-sm font-medium">
                                    Find groups for any class, with filters for
                                    time and location
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="bg-secondary/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                                <MessageSquare className="text-secondary h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-text mb-1 font-semibold">
                                    Built-in chat
                                </h3>
                                <p className="text-text/75 text-sm font-medium">
                                    Message your group without juggling apps
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="bg-secondary/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                                <CalendarClock className="text-secondary h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-text mb-1 font-semibold">
                                    Smart scheduling
                                </h3>
                                <p className="text-text/75 text-sm font-medium">
                                    Set times and locations that work for
                                    everyone
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="bg-secondary/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                                <Shield className="text-secondary h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-text mb-1 font-semibold">
                                    UMN students only
                                </h3>
                                <p className="text-text/75 text-sm font-medium">
                                    Verified accounts keep things safe and
                                    relevant
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="bg-secondary/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                                <Zap className="text-secondary h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-text mb-1 font-semibold">
                                    Join instantly
                                </h3>
                                <p className="text-text/75 text-sm font-medium">
                                    One click to join any group that has space
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="bg-secondary/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg">
                                <Sparkles className="text-secondary h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-text mb-1 font-semibold">
                                    Multiple types
                                </h3>
                                <p className="text-text/75 text-sm font-medium">
                                    Study sessions, club meetings, or events
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* tap in */}
            <section className="bg-card/30 px-4 py-24 sm:px-6">
                <div className="mx-auto max-w-3xl text-center">
                    <h2 className="text-text mb-6 text-3xl font-bold sm:text-4xl md:text-5xl">
                        Ready to find your study crew?
                    </h2>
                    <p className="text-text/80 mb-8 text-lg font-medium">
                        Join hundreds of UMN students already studying smarter
                        together
                    </p>

                    {/* Error Display */}
                    {error && (
                        <div className="mx-auto mb-8 w-full max-w-md">
                            <ViewErrors
                                errors={[error]}
                                clearErrors={() => setError(null)}
                            />
                        </div>
                    )}

                    {/* Google Sign-in */}
                    <div className="mb-8">
                        <div
                            ref={googleLoginContainer}
                            className="flex justify-center"
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
                    </div>

                    <p className="text-text/60 mb-4 text-xs">
                        By signing in, you agree to our{" "}
                        <Link
                            to="/privacy"
                            className="text-secondary font-medium hover:underline"
                        >
                            Privacy Policy
                        </Link>{" "}
                        and{" "}
                        <Link
                            to="/tos"
                            className="text-secondary font-medium hover:underline"
                        >
                            Terms of Service
                        </Link>
                    </p>

                    <div className="mt-8">
                        <Link
                            to="/about"
                            className="group text-text/80 hover:text-text inline-flex items-center gap-2 font-medium transition-colors"
                        >
                            Learn more about Burrow
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    )
}
