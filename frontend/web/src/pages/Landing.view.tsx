import {GoogleLogin, GoogleOAuthProvider} from "@react-oauth/google"
import {useEffect, useState, type ReactNode} from "react"
import {Link, useNavigate} from "react-router"
import {useAtom, useSetAtom} from "jotai"
import toast from "react-hot-toast"
import {useMutation} from "@tanstack/react-query"
import {motion} from "framer-motion"
import {
    CalendarClock,
    Check,
    ListChecks,
    MapPin,
    Megaphone,
    MessageSquare,
    Shield,
    Users
} from "lucide-react"
import {
    authToken,
    newUser,
    refreshTokenAtom,
    userDetails
} from "@features/auth/auth.atom.ts"
import {ViewErrors} from "@umnburrow/core"
import {login} from "@features/auth/user.api.ts"

/** UMN maroon gradient used on the bottom CTA card. */
const MAROON_GRADIENT =
    "bg-[linear-gradient(165deg,#96233c_0%,#7a0019_45%,#45000e_100%)]"

/** Brand maroon accent that flips to gold in the dark theme. */
const ACCENT_TEXT = "text-[#7a0019] [[data-theme=DARK]_&]:text-secondary"

/**
 * The view people get when first visiting Burrow.
 *
 * @author AJ Kneisl
 */
export default function LandingView() {
    const nav = useNavigate()
    const [error, setError] = useState<string | null>(null)

    const [auth, setAuthToken] = useAtom(authToken)
    const setRefreshToken = useSetAtom(refreshTokenAtom)
    const setNewUser = useSetAtom(newUser)
    const setUser = useSetAtom(userDetails)

    // login
    const deviceName = `Web — ${navigator.platform || "Browser"}`

    const loginMutation = useMutation({
        mutationFn: (credentials: string) => login(credentials, deviceName),

        onSuccess: (data) => {
            setAuthToken(data.token)
            setRefreshToken(data.refreshToken)
            setUser(data.user)

            if (data.newUser) {
                setNewUser(true)

                toast.success("Welcome to Burrow!")
                nav("/?new=t")
            } else {
                toast.success("Welcome back to Burrow!")
                nav("/")
            }
        },

        onError: (error: Error) => {
            setError(`${error}`)
        }
    })

    // go away if already authenticated
    useEffect(() => {
        if (auth && auth !== "") {
            nav("/")
        }
    }, [auth, nav])

    const googleButton = (
        <GoogleLogin
            width={280}
            shape="pill"
            size="large"
            text="continue_with"
            onSuccess={(response) =>
                loginMutation.mutate(response.credential ?? "")
            }
            onError={() => {
                toast.error("Failed to authenticate with Google")
            }}
        />
    )

    return (
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
            <div className="relative min-h-screen overflow-x-clip">
                {/* Floating pill nav */}
                <header className="fixed inset-x-0 top-4 z-50 px-4">
                    <nav
                        className="border-card-border/70 bg-background/75 mx-auto flex max-w-3xl items-center justify-between rounded-full border py-2 pr-2 pl-4 shadow-lg shadow-black/5 backdrop-blur-xl">
                        <a href="#top" className="flex items-center gap-2.5">
                            <img
                                src="/image/burrow.png"
                                alt="Burrow"
                                className="h-8 w-8"
                            />
                            <span className="figtree text-text text-lg">
                                Burrow
                            </span>
                        </a>

                        <div className="text-text/70 hidden items-center gap-6 text-sm font-medium sm:flex">
                            <a
                                href="#features"
                                className="hover:text-text transition-colors"
                            >
                                Features
                            </a>
                            <a
                                href="#how"
                                className="hover:text-text transition-colors"
                            >
                                How it works
                            </a>
                        </div>

                        <Link
                            to="/login"
                            className="rounded-full bg-[#7a0019] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#96233c]"
                        >
                            Sign in
                        </Link>
                    </nav>
                </header>

                {/* Hero */}
                <section
                    id="top"
                    className="relative overflow-hidden px-6 pt-36 pb-16 sm:pt-44"
                >
                    <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
                        <motion.p
                            initial={{opacity: 0, y: 16}}
                            animate={{opacity: 1, y: 0}}
                            transition={{duration: 0.5, ease: "easeOut"}}
                            className={`mb-4 text-xs font-bold tracking-[0.2em] uppercase ${ACCENT_TEXT}`}
                        >
                            Made for the University of Minnesota
                        </motion.p>

                        <motion.h1
                            initial={{opacity: 0, y: 20}}
                            animate={{opacity: 1, y: 0}}
                            transition={{
                                duration: 0.55,
                                delay: 0.05,
                                ease: "easeOut"
                            }}
                            className="figtree text-text mb-6 text-5xl leading-[1.05] tracking-tight sm:text-7xl"
                        >
                            Find your people
                            <br/>
                            <span className={ACCENT_TEXT}>at the U.</span>
                        </motion.h1>

                        <motion.p
                            initial={{opacity: 0, y: 20}}
                            animate={{opacity: 1, y: 0}}
                            transition={{
                                duration: 0.55,
                                delay: 0.12,
                                ease: "easeOut"
                            }}
                            className="text-text/60 mb-10 max-w-xl text-lg sm:text-xl"
                        >
                            Study sessions, project teams, clubs, and friends.
                            Everything happening on campus, in one place.
                        </motion.p>

                        {error && (
                            <div className="mb-6 w-full max-w-md">
                                <ViewErrors
                                    errors={[error]}
                                    clearErrors={() => setError(null)}
                                />
                            </div>
                        )}

                        <motion.div
                            initial={{opacity: 0, y: 20}}
                            animate={{opacity: 1, y: 0}}
                            transition={{
                                duration: 0.55,
                                delay: 0.18,
                                ease: "easeOut"
                            }}
                            className="flex flex-col items-center"
                        >
                            {googleButton}

                            <Link
                                to="/login"
                                className="text-text/60 hover:text-text mt-4 text-sm font-medium transition-colors"
                            >
                                Sign in a different way
                            </Link>

                            <p className="text-text/45 mt-6 flex items-center gap-1.5 text-xs">
                                <Shield className="h-3.5 w-3.5"/>
                                Verified UMN students only (@umn.edu)
                            </p>

                            <p className="text-text/45 mt-3 text-xs">
                                By signing in, you agree to our{" "}
                                <Link
                                    to="/privacy"
                                    className="text-text/60 hover:text-text underline"
                                >
                                    Privacy Policy
                                </Link>{" "}
                                and{" "}
                                <Link
                                    to="/tos"
                                    className="text-text/60 hover:text-text underline"
                                >
                                    Terms of Service
                                </Link>
                            </p>
                        </motion.div>
                    </div>

                    {/* Hero app-window demo */}
                    <motion.div
                        initial={{opacity: 0, y: 40}}
                        animate={{opacity: 1, y: 0}}
                        transition={{
                            duration: 0.7,
                            delay: 0.3,
                            ease: "easeOut"
                        }}
                        className="mx-auto mt-16 max-w-4xl"
                    >
                        <HeroWindowDemo/>
                    </motion.div>
                </section>

                {/* Feature demos */}
                <section id="features" className="px-6 pt-24">
                    <div className="mx-auto max-w-5xl">
                        <FadeIn className="mx-auto mb-20 max-w-2xl text-center">
                            <p
                                className={`mb-3 text-xs font-bold tracking-[0.2em] uppercase ${ACCENT_TEXT}`}
                            >
                                Features
                            </p>
                            <h2 className="figtree text-text text-4xl tracking-tight sm:text-5xl">
                                One app for your
                                <br/>
                                whole campus life.
                            </h2>
                        </FadeIn>

                        <FeatureSection
                            icon={<CalendarClock className="h-5 w-5"/>}
                            eyebrow="Study Burrows"
                            title="Never study alone again."
                            description="Start a study session for any class in seconds. Pick a time and a spot on campus, and classmates can find it and join instantly."
                            bullets={[
                                "Organized by course, so the right people find you",
                                "Time, place, and attendees at a glance",
                                "Join with one tap"
                            ]}
                            demo={<StudyBurrowDemo/>}
                        />

                        <FeatureSection
                            flip
                            icon={<ListChecks className="h-5 w-5"/>}
                            eyebrow="Project Burrows"
                            title="Build things with your team."
                            description="Project Burrows are longer-lived spaces for class projects, hackathons, and side projects, with your team, tasks, and chat together."
                            bullets={[
                                "A home base that outlasts a single meetup",
                                "Track what's done and what's next",
                                "Everyone stays on the same page"
                            ]}
                            demo={<ProjectBurrowDemo/>}
                        />

                        <FadeIn className="grid gap-6 sm:grid-cols-3">
                            <FeatureCard
                                icon={<Megaphone className="h-5 w-5"/>}
                                title="Clubs, beyond the fair"
                                description="Browse every club on campus and keep up with announcements without digging through email."
                            />
                            <FeatureCard
                                icon={<MessageSquare className="h-5 w-5"/>}
                                title="Chat where the plans are"
                                description="Every burrow and club comes with built-in chat, right where the conversation belongs."
                            />
                            <FeatureCard
                                icon={<Users className="h-5 w-5"/>}
                                title="Keep the people you meet"
                                description="Add friends from a study session and make the next plan together."
                            />
                        </FadeIn>
                    </div>
                </section>

                {/* How it works */}
                <section id="how" className="px-6 pt-8 pb-24">
                    <div className="mx-auto max-w-5xl">
                        <FadeIn className="mx-auto mb-14 max-w-2xl text-center">
                            <p
                                className={`mb-3 text-xs font-bold tracking-[0.2em] uppercase ${ACCENT_TEXT}`}
                            >
                                How it works
                            </p>
                            <h2 className="figtree text-text text-4xl tracking-tight sm:text-5xl">
                                Three steps. That's it.
                            </h2>
                        </FadeIn>

                        <div className="grid gap-6 sm:grid-cols-3">
                            <StepCard
                                number="1"
                                title="Sign in"
                                description="Use your UMN email. That's the whole signup."
                            />
                            <StepCard
                                number="2"
                                title="Find a Burrow"
                                description="Browse sessions and clubs, or start your own."
                            />
                            <StepCard
                                number="3"
                                title="Show up"
                                description="Study, build, and meet people who get it."
                            />
                        </div>
                    </div>
                </section>

                {/* Bottom CTA */}
                <section className="px-6 pb-16">
                    <FadeIn>
                        <div
                            className={`relative mx-auto max-w-5xl overflow-hidden rounded-[32px] px-8 py-20 text-center ${MAROON_GRADIENT}`}
                        >
                            <div className="relative flex flex-col items-center">
                                <h2 className="figtree mb-4 text-4xl tracking-tight text-white sm:text-5xl">
                                    Your people are
                                    <br/>
                                    already here.
                                </h2>

                                <p className="mb-10 max-w-md text-white/70">
                                    It takes about ten seconds to join. Bring
                                    your @umn.edu email.
                                </p>

                                {googleButton}

                                <p className="mt-5 text-xs text-white/55">
                                    UMN email required (@umn.edu)
                                </p>
                            </div>
                        </div>
                    </FadeIn>
                </section>
            </div>
        </GoogleOAuthProvider>
    )
}

/**
 * Fades content up into view the first time it scrolls onto screen.
 */
function FadeIn({
                    children,
                    className,
                    delay = 0
                }: {
    children: ReactNode
    className?: string
    delay?: number
}) {
    return (
        <motion.div
            className={className}
            initial={{opacity: 0, y: 28}}
            whileInView={{opacity: 1, y: 0}}
            viewport={{once: true, margin: "-80px"}}
            transition={{duration: 0.6, delay, ease: "easeOut"}}
        >
            {children}
        </motion.div>
    )
}

/**
 * A feature block: copy on one side, a product demo on the other.
 */
function FeatureSection({
                            icon,
                            eyebrow,
                            title,
                            description,
                            bullets,
                            demo,
                            flip = false
                        }: {
    icon: ReactNode
    eyebrow: string
    title: string
    description: string
    bullets: string[]
    demo: ReactNode
    flip?: boolean
}) {
    return (
        <div className="mb-24 grid items-center gap-10 sm:mb-32 sm:grid-cols-2 sm:gap-16">
            <FadeIn className={flip ? "sm:order-2" : ""}>
                <div
                    className={`mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7a0019] text-white`}
                >
                    {icon}
                </div>

                <p
                    className={`mb-2 text-xs font-bold tracking-[0.2em] uppercase ${ACCENT_TEXT}`}
                >
                    {eyebrow}
                </p>

                <h3 className="figtree text-text mb-4 text-3xl tracking-tight sm:text-4xl">
                    {title}
                </h3>

                <p className="text-text/60 mb-6 text-lg">{description}</p>

                <ul className="flex flex-col gap-3">
                    {bullets.map((bullet) => (
                        <li
                            key={bullet}
                            className="text-text/70 flex items-start gap-2.5 text-sm"
                        >
                            <span
                                className="bg-secondary mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full">
                                <Check className="h-3 w-3 text-gray-900"/>
                            </span>
                            {bullet}
                        </li>
                    ))}
                </ul>
            </FadeIn>

            <FadeIn
                delay={0.1}
                className={`pointer-events-none select-none ${flip ? "sm:order-1" : ""}`}
            >
                {demo}
            </FadeIn>
        </div>
    )
}

/**
 * A compact feature callout: icon, title, one-line description. No demo.
 */
function FeatureCard({
                         icon,
                         title,
                         description
                     }: {
    icon: ReactNode
    title: string
    description: string
}) {
    return (
        <div className="border-card-border bg-card rounded-2xl border p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#7a0019] text-white">
                {icon}
            </div>
            <h3 className="text-text mb-1.5 text-lg font-semibold">
                {title}
            </h3>
            <p className="text-text/60 text-sm">{description}</p>
        </div>
    )
}

/**
 * A step in the "How it works" section.
 */
function StepCard({
                      number,
                      title,
                      description
                  }: {
    number: string
    title: string
    description: string
}) {
    return (
        <FadeIn className="bg-card border-card-border rounded-3xl border p-7">
            <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-[#7a0019]">
                <span className="text-secondary font-bold">{number}</span>
            </div>
            <h3 className="text-text mb-1.5 text-lg font-semibold">{title}</h3>
            <p className="text-text/60 text-sm">{description}</p>
        </FadeIn>
    )
}

/**
 * Mac-style window chrome wrapper shared by the demo mockups.
 */
function DemoWindow({
                        label,
                        children,
                        className = ""
                    }: {
    label: string
    children: ReactNode
    className?: string
}) {
    return (
        <div
            className={`bg-card border-card-border overflow-hidden rounded-3xl border shadow-2xl shadow-black/10 ${className}`}
        >
            <div className="border-card-border bg-background flex items-center gap-2 border-b px-5 py-3.5">
                <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-[#ff5f57]"/>
                    <div className="h-3 w-3 rounded-full bg-[#febc2e]"/>
                    <div className="h-3 w-3 rounded-full bg-[#28c840]"/>
                </div>
                <span className="text-text/45 ml-2 text-xs font-semibold tracking-widest uppercase">
                    {label}
                </span>
            </div>
            <div className="p-5">{children}</div>
        </div>
    )
}

/** Small circular avatar used across the demos. */
function Avatar({
                    initials,
                    color = "maroon",
                    className = ""
                }: {
    initials: string
    color?: "maroon" | "gold" | "gray"
    className?: string
}) {
    const colors = {
        maroon: "bg-[#7a0019] text-white",
        gold: "bg-secondary text-gray-900",
        gray: "bg-card-border text-text"
    }

    return (
        <div
            className={`border-card flex h-8 w-8 items-center justify-center rounded-full border-2 text-[10px] font-bold ${colors[color]} ${className}`}
        >
            {initials}
        </div>
    )
}

/** Pill-shaped tag used on the demo cards. */
function Tag({
                 children,
                 solid = false
             }: {
    children: ReactNode
    solid?: boolean
}) {
    return (
        <span
            className={
                solid
                    ? "bg-secondary rounded-full px-2.5 py-1 text-[10px] font-bold tracking-widest text-gray-900"
                    : "border-card-border text-text/70 rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-widest"
            }
        >
            {children}
        </span>
    )
}

/**
 * The big hero mockup: a study session card with a live chat beside it,
 * framed like the app in a browser window.
 */
function HeroWindowDemo() {
    return (
        <DemoWindow label="burrow.study" className="relative">
            <div className="pointer-events-none grid gap-4 select-none sm:grid-cols-5">
                {/* Session card */}
                <div className="bg-background border-card-border rounded-2xl border p-5 sm:col-span-3">
                    <div className="mb-3 flex items-center gap-2">
                        <Tag solid>STUDY</Tag>
                        <Tag>CSCI 1133</Tag>
                    </div>

                    <h3 className="text-text mb-3 text-lg font-semibold">
                        Homework 4 study session
                    </h3>

                    <div className="text-text/60 flex flex-col gap-1.5 text-sm">
                        <div className="flex items-center gap-2">
                            <CalendarClock className="h-4 w-4"/>
                            Tonight · 7:00 PM
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4"/>
                            Lind Hall 325
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="flex">
                                <Avatar initials="AJ"/>
                                <Avatar
                                    initials="MK"
                                    color="gold"
                                    className="-ml-2"
                                />
                                <Avatar
                                    initials="+3"
                                    color="gray"
                                    className="-ml-2"
                                />
                            </div>
                            <span className="text-text/60 ml-3 text-sm">
                                5 going
                            </span>
                        </div>

                        <div className="rounded-full bg-[#7a0019] px-5 py-2 text-sm font-semibold text-white">
                            Join
                        </div>
                    </div>
                </div>

                {/* Chat preview */}
                <div className="bg-background border-card-border rounded-2xl border p-4 sm:col-span-2">
                    <div
                        className="text-text/45 mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase">
                        <MessageSquare className="h-3.5 w-3.5"/>
                        Chat
                    </div>

                    <div className="flex flex-col gap-2">
                        <div
                            className="bg-card border-card-border text-text max-w-[90%] self-start rounded-2xl rounded-bl-md border px-3.5 py-2 text-sm">
                            anyone else stuck on problem 3?
                        </div>
                        <div
                            className="max-w-[90%] self-end rounded-2xl rounded-br-md bg-[#7a0019] px-3.5 py-2 text-sm text-white">
                            yeah, we got a table by the windows
                        </div>
                        <div
                            className="bg-card border-card-border text-text max-w-[90%] self-start rounded-2xl rounded-bl-md border px-3.5 py-2 text-sm">
                            omw 🏃
                        </div>
                    </div>
                </div>
            </div>
        </DemoWindow>
    )
}

/**
 * Demo: browsing study sessions for a course.
 */
function StudyBurrowDemo() {
    return (
        <DemoWindow label="Browse · CSCI 2021">
            <div className="flex flex-col gap-3">
                <div className="bg-background border-card-border rounded-2xl border p-4">
                    <div className="mb-2 flex items-center gap-2">
                        <Tag solid>STUDY</Tag>
                        <Tag>CSCI 2021</Tag>
                    </div>
                    <h4 className="text-text mb-2 font-semibold">
                        Midterm 2 review grind
                    </h4>
                    <div className="text-text/60 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                        <span className="flex items-center gap-1.5">
                            <CalendarClock className="h-4 w-4"/>
                            Thu · 6:30 PM
                        </span>
                        <span className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4"/>
                            Walter Library
                        </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center">
                            <Avatar initials="SR" color="gold"/>
                            <Avatar initials="DT" className="-ml-2"/>
                            <Avatar
                                initials="+4"
                                color="gray"
                                className="-ml-2"
                            />
                        </div>
                        <div className="rounded-full bg-[#7a0019] px-4 py-1.5 text-xs font-semibold text-white">
                            Join
                        </div>
                    </div>
                </div>

                <div className="bg-background border-card-border rounded-2xl border p-4 opacity-70">
                    <div className="mb-2 flex items-center gap-2">
                        <Tag solid>STUDY</Tag>
                        <Tag>CSCI 2021</Tag>
                    </div>
                    <h4 className="text-text mb-2 font-semibold">
                        Lab 8 co-working
                    </h4>
                    <div className="text-text/60 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                        <span className="flex items-center gap-1.5">
                            <CalendarClock className="h-4 w-4"/>
                            Sat · 1:00 PM
                        </span>
                        <span className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4"/>
                            Keller Hall
                        </span>
                    </div>
                </div>
            </div>
        </DemoWindow>
    )
}

/**
 * Demo: a project burrow with a task list and team.
 */
function ProjectBurrowDemo() {
    return (
        <DemoWindow label="Project Burrow">
            <div className="mb-3 flex items-center gap-2">
                <Tag solid>PROJECT</Tag>
                <Tag>HACKATHON</Tag>
            </div>

            <h4 className="text-text mb-1 text-lg font-semibold">
                MinneHack campus events app
            </h4>
            <p className="text-text/55 mb-4 text-sm">
                Team of 4 · Demo day in 12 days
            </p>

            <div className="flex flex-col gap-2">
                <div className="bg-background border-card-border flex items-center gap-3 rounded-xl border px-4 py-2.5">
                    <span className="bg-secondary flex h-5 w-5 items-center justify-center rounded-md">
                        <Check className="h-3.5 w-3.5 text-gray-900"/>
                    </span>
                    <span className="text-text/50 text-sm line-through">
                        Set up the repo
                    </span>
                </div>
                <div className="bg-background border-card-border flex items-center gap-3 rounded-xl border px-4 py-2.5">
                    <span className="bg-secondary flex h-5 w-5 items-center justify-center rounded-md">
                        <Check className="h-3.5 w-3.5 text-gray-900"/>
                    </span>
                    <span className="text-text/50 text-sm line-through">
                        Sketch the event feed
                    </span>
                </div>
                <div className="bg-background border-card-border flex items-center gap-3 rounded-xl border px-4 py-2.5">
                    <span className="border-card-border h-5 w-5 rounded-md border-2"/>
                    <span className="text-text text-sm">
                        Hook up the map view
                    </span>
                    <Avatar initials="AJ" className="ml-auto h-6 w-6"/>
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center">
                    <Avatar initials="AJ"/>
                    <Avatar initials="MK" color="gold" className="-ml-2"/>
                    <Avatar initials="SR" color="gray" className="-ml-2"/>
                    <Avatar initials="DT" className="-ml-2"/>
                </div>
                <span className="text-text/60 text-sm">2 of 5 done</span>
            </div>
        </DemoWindow>
    )
}

