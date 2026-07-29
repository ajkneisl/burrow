import {GoogleLogin, GoogleOAuthProvider} from "@react-oauth/google"
import {useEffect, useState, type ReactNode} from "react"
import {Link, useNavigate} from "react-router"
import {useAtom, useSetAtom} from "jotai"
import toast from "react-hot-toast"
import {useMutation} from "@tanstack/react-query"
import {motion} from "framer-motion"
import {
    ArrowRight,
    CalendarClock,
    Check,
    GraduationCap,
    ListChecks,
    MapPin,
    Megaphone,
    MessageSquare,
    Shield,
    UserPlus,
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

/** UMN maroon gradient shared by the hero glow and the bottom CTA card. */
const MAROON_GRADIENT =
    "bg-[linear-gradient(165deg,#96233c_0%,#7a0019_45%,#45000e_100%)]"

/** Soft gold glow layered on top of the maroon surfaces. */
const GOLD_GLOW =
    "bg-[radial-gradient(circle_at_50%_30%,rgba(255,204,0,0.22)_0%,rgba(255,204,0,0)_60%)]"

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
                        className="mx-auto flex max-w-3xl items-center justify-between rounded-full border border-card-border/70 bg-background/75 py-2 pr-2 pl-4 shadow-lg shadow-black/5 backdrop-blur-xl">
                        <a href="#top" className="flex items-center gap-2.5">
                            <img
                                src="/image/burrow.png"
                                alt="Burrow"
                                className="size-8"
                            />
                            <span className="figtree text-lg text-text">
                                Burrow
                            </span>
                        </a>

                        <div className="hidden items-center gap-6 text-sm font-medium text-text/70 sm:flex">
                            <a
                                href="#features"
                                className="transition-colors hover:text-text"
                            >
                                Features
                            </a>
                            <a
                                href="#how"
                                className="transition-colors hover:text-text"
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
                    {/* Ambient background glow */}
                    <div className="pointer-events-none absolute inset-0">
                        <div
                            className="absolute -top-40 left-1/2 h-130 w-205 -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(122,0,25,0.14)_0%,rgba(122,0,25,0)_100%)]"/>
                        <div
                            className="absolute top-24 left-[12%] size-72 rounded-full bg-[radial-gradient(closest-side,rgba(255,204,0,0.16)_0%,rgba(255,204,0,0)_100%)]"/>
                        <div
                            className="absolute top-40 right-[8%] size-80 rounded-full bg-[radial-gradient(closest-side,rgba(122,0,25,0.10)_0%,rgba(122,0,25,0)_100%)]"/>
                    </div>

                    <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
                        <motion.div
                            initial={{opacity: 0, y: 16}}
                            animate={{opacity: 1, y: 0}}
                            transition={{duration: 0.5, ease: "easeOut"}}
                            className="mb-6 flex items-center gap-2 rounded-full border border-card-border bg-card px-4 py-1.5 text-xs font-semibold text-text/70"
                        >
                            <GraduationCap className="size-3.5"/>
                            Made for the University of Minnesota
                        </motion.div>

                        <motion.h1
                            initial={{opacity: 0, y: 20}}
                            animate={{opacity: 1, y: 0}}
                            transition={{
                                duration: 0.55,
                                delay: 0.05,
                                ease: "easeOut"
                            }}
                            className="figtree leading-1.05 mb-6 text-5xl tracking-tight text-text sm:text-7xl"
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
                            className="mb-10 max-w-xl text-lg text-text/60 sm:text-xl"
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
                                className="mt-4 text-sm font-medium text-text/60 transition-colors hover:text-text"
                            >
                                Sign in a different way
                            </Link>

                            <p className="mt-6 flex items-center gap-1.5 text-xs text-text/45">
                                <Shield className="size-3.5"/>
                                Verified UMN students only (@umn.edu)
                            </p>

                            <p className="mt-3 text-xs text-text/45">
                                By signing in, you agree to our{" "}
                                <Link
                                    to="/privacy"
                                    className="text-text/60 underline hover:text-text"
                                >
                                    Privacy Policy
                                </Link>{" "}
                                and{" "}
                                <Link
                                    to="/tos"
                                    className="text-text/60 underline hover:text-text"
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
                        className="relative mx-auto mt-16 max-w-4xl"
                    >
                        <div
                            className={`absolute inset-x-8 -top-6 bottom-8 rounded-[40px] opacity-60 blur-3xl ${MAROON_GRADIENT}`}
                        />
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
                            <h2 className="figtree text-4xl tracking-tight text-text sm:text-5xl">
                                One app for your
                                <br/>
                                whole campus life.
                            </h2>
                        </FadeIn>

                        <FeatureSection
                            icon={<CalendarClock className="size-5"/>}
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
                            icon={<ListChecks className="size-5"/>}
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

                        <FeatureSection
                            icon={<Megaphone className="size-5"/>}
                            eyebrow="Clubs"
                            title="Your club, beyond the club fair."
                            description="Browse every club on campus, join the ones you love, and keep up with announcements and events without digging through emails."
                            bullets={[
                                "Discover clubs you didn't know existed",
                                "Announcements and events in one feed",
                                "See all your clubs on your profile"
                            ]}
                            demo={<ClubDemo/>}
                        />

                        <FeatureSection
                            flip
                            icon={<MessageSquare className="size-5"/>}
                            eyebrow="Messaging"
                            title="Chat lives where the plans are."
                            description="Every burrow and club comes with built-in chat, so the conversation stays with the people and plans it belongs to."
                            bullets={[
                                "No more hunting for the right group chat",
                                "Message friends directly, too",
                                "See it all in real time"
                            ]}
                            demo={<ChatDemo/>}
                        />

                        <FeatureSection
                            icon={<Users className="size-5"/>}
                            eyebrow="Friends"
                            title="Keep the people you meet."
                            description="Met someone great in a study session? Add them as a friend, see what they're up to, and make the next plan together."
                            bullets={[
                                "Send and accept friend requests",
                                "See mutual burrows and clubs",
                                "All your friends in one list"
                            ]}
                            demo={<FriendsDemo/>}
                        />
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
                            <h2 className="figtree text-4xl tracking-tight text-text sm:text-5xl">
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
                            <div
                                className={`absolute inset-x-0 top-0 h-64 ${GOLD_GLOW}`}
                            />
                            <div className="absolute -top-24 -left-24 size-72 rounded-full bg-white/5"/>
                            <div className="absolute -right-20 -bottom-28 size-80 rounded-full bg-white/5"/>

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
                    className={`mb-5 flex size-11 items-center justify-center rounded-2xl bg-[#7a0019] text-white`}
                >
                    {icon}
                </div>

                <p
                    className={`mb-2 text-xs font-bold tracking-[0.2em] uppercase ${ACCENT_TEXT}`}
                >
                    {eyebrow}
                </p>

                <h3 className="figtree mb-4 text-3xl tracking-tight text-text sm:text-4xl">
                    {title}
                </h3>

                <p className="mb-6 text-lg text-text/60">{description}</p>

                <ul className="flex flex-col gap-3">
                    {bullets.map((bullet) => (
                        <li
                            key={bullet}
                            className="flex items-start gap-2.5 text-sm text-text/70"
                        >
                            <span
                                className="mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full bg-secondary">
                                <Check className="size-3 text-gray-900"/>
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
        <FadeIn className="rounded-3xl border border-card-border bg-card p-7">
            <div className="mb-5 flex size-10 items-center justify-center rounded-full bg-[#7a0019]">
                <span className="font-bold text-secondary">{number}</span>
            </div>
            <h3 className="mb-1.5 text-lg font-semibold text-text">{title}</h3>
            <p className="text-sm text-text/60">{description}</p>
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
            className={`overflow-hidden rounded-3xl border border-card-border bg-card shadow-2xl shadow-black/10 ${className}`}
        >
            <div className="flex items-center gap-2 border-b border-card-border bg-background px-5 py-3.5">
                <div className="flex gap-1.5">
                    <div className="size-3 rounded-full bg-[#ff5f57]"/>
                    <div className="size-3 rounded-full bg-[#febc2e]"/>
                    <div className="size-3 rounded-full bg-[#28c840]"/>
                </div>
                <span className="ml-2 text-xs font-semibold tracking-widest text-text/45 uppercase">
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
            className={`flex size-8 items-center justify-center rounded-full border-2 border-card text-[10px] font-bold ${colors[color]} ${className}`}
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
                    ? "rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold tracking-widest text-gray-900"
                    : "rounded-full border border-card-border px-2.5 py-1 text-[10px] font-semibold tracking-widest text-text/70"
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
                <div className="rounded-2xl border border-card-border bg-background p-5 sm:col-span-3">
                    <div className="mb-3 flex items-center gap-2">
                        <Tag solid>STUDY</Tag>
                        <Tag>CSCI 1133</Tag>
                    </div>

                    <h3 className="mb-3 text-lg font-semibold text-text">
                        Homework 4 study session
                    </h3>

                    <div className="flex flex-col gap-1.5 text-sm text-text/60">
                        <div className="flex items-center gap-2">
                            <CalendarClock className="size-4"/>
                            Tonight · 7:00 PM
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="size-4"/>
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
                            <span className="ml-3 text-sm text-text/60">
                                5 going
                            </span>
                        </div>

                        <div className="rounded-full bg-[#7a0019] px-5 py-2 text-sm font-semibold text-white">
                            Join
                        </div>
                    </div>
                </div>

                {/* Chat preview */}
                <div className="rounded-2xl border border-card-border bg-background p-4 sm:col-span-2">
                    <div
                        className="mb-3 flex items-center gap-1.5 text-xs font-semibold tracking-widest text-text/45 uppercase">
                        <MessageSquare className="size-3.5"/>
                        Chat
                    </div>

                    <div className="flex flex-col gap-2">
                        <div
                            className="max-w-[90%] self-start rounded-2xl rounded-bl-md border border-card-border bg-card px-3.5 py-2 text-sm text-text">
                            anyone else stuck on problem 3?
                        </div>
                        <div
                            className="max-w-[90%] self-end rounded-2xl rounded-br-md bg-[#7a0019] px-3.5 py-2 text-sm text-white">
                            yeah, we got a table by the windows
                        </div>
                        <div
                            className="max-w-[90%] self-start rounded-2xl rounded-bl-md border border-card-border bg-card px-3.5 py-2 text-sm text-text">
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
                <div className="rounded-2xl border border-card-border bg-background p-4">
                    <div className="mb-2 flex items-center gap-2">
                        <Tag solid>STUDY</Tag>
                        <Tag>CSCI 2021</Tag>
                    </div>
                    <h4 className="mb-2 font-semibold text-text">
                        Midterm 2 review grind
                    </h4>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text/60">
                        <span className="flex items-center gap-1.5">
                            <CalendarClock className="size-4"/>
                            Thu · 6:30 PM
                        </span>
                        <span className="flex items-center gap-1.5">
                            <MapPin className="size-4"/>
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

                <div className="rounded-2xl border border-card-border bg-background p-4 opacity-70">
                    <div className="mb-2 flex items-center gap-2">
                        <Tag solid>STUDY</Tag>
                        <Tag>CSCI 2021</Tag>
                    </div>
                    <h4 className="mb-2 font-semibold text-text">
                        Lab 8 co-working
                    </h4>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text/60">
                        <span className="flex items-center gap-1.5">
                            <CalendarClock className="size-4"/>
                            Sat · 1:00 PM
                        </span>
                        <span className="flex items-center gap-1.5">
                            <MapPin className="size-4"/>
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

            <h4 className="mb-1 text-lg font-semibold text-text">
                MinneHack campus events app
            </h4>
            <p className="mb-4 text-sm text-text/55">
                Team of 4 · Demo day in 12 days
            </p>

            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 rounded-xl border border-card-border bg-background px-4 py-2.5">
                    <span className="flex size-5 items-center justify-center rounded-md bg-secondary">
                        <Check className="size-3.5 text-gray-900"/>
                    </span>
                    <span className="text-sm text-text/50 line-through">
                        Set up the repo
                    </span>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-card-border bg-background px-4 py-2.5">
                    <span className="flex size-5 items-center justify-center rounded-md bg-secondary">
                        <Check className="size-3.5 text-gray-900"/>
                    </span>
                    <span className="text-sm text-text/50 line-through">
                        Sketch the event feed
                    </span>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-card-border bg-background px-4 py-2.5">
                    <span className="size-5 rounded-md border-2 border-card-border"/>
                    <span className="text-sm text-text">
                        Hook up the map view
                    </span>
                    <Avatar initials="AJ" className="ml-auto size-6"/>
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center">
                    <Avatar initials="AJ"/>
                    <Avatar initials="MK" color="gold" className="-ml-2"/>
                    <Avatar initials="SR" color="gray" className="-ml-2"/>
                    <Avatar initials="DT" className="-ml-2"/>
                </div>
                <span className="text-sm text-text/60">2 of 5 done</span>
            </div>
        </DemoWindow>
    )
}

/**
 * Demo: a club page with an announcement and upcoming event.
 */
function ClubDemo() {
    return (
        <DemoWindow label="Clubs">
            <div
                className={`relative mb-4 flex h-20 items-end overflow-hidden rounded-2xl p-4 ${MAROON_GRADIENT}`}
            >
                <div className={`absolute inset-0 ${GOLD_GLOW}`}/>
                <h4 className="figtree relative text-xl text-white">
                    Gopher Robotics Club
                </h4>
            </div>

            <div className="mb-4 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm text-text/60">
                    <Users className="size-4"/>
                    128 members
                </span>
                <div className="rounded-full bg-[#7a0019] px-4 py-1.5 text-xs font-semibold text-white">
                    Join club
                </div>
            </div>

            <div className="flex flex-col gap-2.5">
                <div className="rounded-xl border border-card-border bg-background p-3.5">
                    <div
                        className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-text/45 uppercase">
                        <Megaphone className="size-3"/>
                        Announcement
                    </div>
                    <p className="text-sm text-text">
                        Parts for the new arm came in! Build night moved to
                        Thursday 🤖
                    </p>
                </div>

                <div
                    className="flex items-center justify-between rounded-xl border border-card-border bg-background p-3.5">
                    <div>
                        <p className="text-sm font-semibold text-text">
                            Build night
                        </p>
                        <p className="text-xs text-text/55">
                            Thu · 6:00 PM · Anderson Labs
                        </p>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-semibold text-text/60">
                        RSVP
                        <ArrowRight className="size-3.5"/>
                    </span>
                </div>
            </div>
        </DemoWindow>
    )
}

/**
 * Demo: a live chat thread with a typing indicator.
 */
function ChatDemo() {
    return (
        <DemoWindow label="Chat · HW 4 study session">
            <div className="flex flex-col gap-2.5">
                <div className="flex items-end gap-2">
                    <Avatar initials="MK" color="gold" className="size-6"/>
                    <div
                        className="max-w-[80%] rounded-2xl rounded-bl-md border border-card-border bg-background px-4 py-2 text-sm text-text">
                        does anyone have the notes from Friday?
                    </div>
                </div>

                <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-br-md bg-[#7a0019] px-4 py-2 text-sm text-white">
                        yep, dropping them here in a sec 📄
                    </div>
                </div>

                <div className="flex items-end gap-2">
                    <Avatar initials="SR" className="size-6"/>
                    <div
                        className="max-w-[80%] rounded-2xl rounded-bl-md border border-card-border bg-background px-4 py-2 text-sm text-text">
                        you're the best. same room as last week?
                    </div>
                </div>

                <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-br-md bg-[#7a0019] px-4 py-2 text-sm text-white">
                        yeah, Lind 325, we're by the windows
                    </div>
                </div>

                {/* Typing indicator */}
                <div className="flex items-end gap-2">
                    <Avatar initials="MK" color="gold" className="size-6"/>
                    <div
                        className="flex gap-1 rounded-2xl rounded-bl-md border border-card-border bg-background px-4 py-3">
                        <span className="size-1.5 animate-bounce rounded-full bg-text/40"/>
                        <span className="size-1.5 animate-bounce rounded-full bg-text/40 [animation-delay:0.15s]"/>
                        <span className="size-1.5 animate-bounce rounded-full bg-text/40 [animation-delay:0.3s]"/>
                    </div>
                </div>
            </div>

            {/* Input bar */}
            <div
                className="mt-4 flex items-center justify-between rounded-full border border-card-border bg-background px-4 py-2.5 text-sm text-text/40">
                Message the group…
                <span className="flex size-6 items-center justify-center rounded-full bg-[#7a0019]">
                    <ArrowRight className="size-3.5 text-white"/>
                </span>
            </div>
        </DemoWindow>
    )
}

/**
 * Demo: a friend request and friends list.
 */
function FriendsDemo() {
    return (
        <DemoWindow label="Friends">
            <div className="mb-3 rounded-2xl border border-card-border bg-background p-4">
                <div className="flex items-center gap-3">
                    <Avatar initials="MK" color="gold" className="size-10"/>
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-text">
                            Maya K.
                        </p>
                        <p className="text-xs text-text/55">
                            2 mutual burrows · CSCI 1133
                        </p>
                    </div>
                    <div
                        className="ml-auto flex items-center gap-1.5 rounded-full bg-[#7a0019] px-4 py-1.5 text-xs font-semibold text-white">
                        <UserPlus className="size-3.5"/>
                        Accept
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 rounded-xl border border-card-border bg-background px-4 py-2.5">
                    <div className="relative">
                        <Avatar initials="SR"/>
                        <span
                            className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-card bg-success"/>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-text">
                            Sam R.
                        </p>
                        <p className="text-xs text-text/55">
                            In a burrow now · Walter Library
                        </p>
                    </div>
                    <MessageSquare className="ml-auto size-4 text-text/40"/>
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-card-border bg-background px-4 py-2.5">
                    <div className="relative">
                        <Avatar initials="DT" color="gray"/>
                        <span
                            className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-card bg-success"/>
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-text">
                            Devin T.
                        </p>
                        <p className="text-xs text-text/55">
                            Gopher Robotics Club
                        </p>
                    </div>
                    <MessageSquare className="ml-auto size-4 text-text/40"/>
                </div>
            </div>
        </DemoWindow>
    )
}
