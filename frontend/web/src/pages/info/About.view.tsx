import { useState } from "react"
import {
    ChevronDown,
    ExternalLink,
    Heart,
    BookOpen,
    Users,
    MessageSquare,
    Shield,
    Flag,
    Plus,
    Trash2,
    Search
} from "lucide-react"
import { Link } from "react-router"

const faqItems: { id: string; question: string; answer: string; icon: typeof Search }[] = [
    {
        id: "how-find",
        question: "How do I find a study group?",
        answer: "Search on the home page or browse all burrows to find relevant coursework or topics.",
        icon: Search
    },
    {
        id: "how-create",
        question: "How do I create my own Burrow?",
        answer: "Click \"Create\" in the header on desktop or the \"+\" button on mobile, choose your Burrow type, and fill in the details.",
        icon: Plus
    },
    {
        id: "how-join",
        question: "How do I join a Burrow?",
        answer: "Find a Burrow and click \"Join.\" If it's full, you'll be added to the waitlist and moved in when space opens up.",
        icon: Users
    },
    {
        id: "safety",
        question: "What are the safety measures?",
        answer: "All users authenticate with University of Minnesota credentials and are held to University standards. Contact us at support@umn.app with any concerns.",
        icon: Shield
    },
    {
        id: "how-cancel",
        question: "How do I delete a Burrow?",
        answer: "Navigate to your Burrow's page, click \"Delete,\" and confirm.",
        icon: Trash2
    },
    {
        id: "how-report",
        question: "How do I report a problem?",
        answer: "Open the menu in the top right and press \"Give Feedback.\" We'll follow up by email if needed.",
        icon: Flag
    }
]

const teamMembers = [
    {
        name: "AJ Kneisl",
        role: "App, Web, & Backend",
        image: "https://umn.app/image/team/aj.jpeg",
        linkedin: "https://www.linkedin.com/in/ajkn/",
        lead: true
    },
    {
        name: "Joshua Westerlund",
        role: "Design & Outreach",
        image: "https://umn.app/image/team/josh.jpeg",
        linkedin: "https://www.linkedin.com/in/weste637/"
    },
    {
        name: "Yordanos Eshete",
        role: "Web & Outreach",
        image: "https://umn.app/image/team/yord.jpeg",
        linkedin: "https://www.linkedin.com/in/yordanoseshete/"
    },
    {
        name: "Ben Stortroen",
        role: "Web Developer",
        image: "https://umn.app/image/team/ben.jpeg",
        linkedin: "https://www.linkedin.com/in/benjamin-stortroen-b61400347/"
    },
    {
        name: "Thien-Tri Nguyen",
        role: "Design & Web",
        image: "https://umn.app/image/team/tri.jpeg",
        linkedin: "https://www.linkedin.com/in/thientri-nguyen/"
    }
]

const techStack = [
    { name: "Kotlin & Ktor", desc: "Backend" },
    { name: "PostgreSQL", desc: "Database" },
    { name: "MinIO", desc: "Image Hosting" },
    { name: "React & TypeScript", desc: "Frontend" },
    { name: "TailwindCSS", desc: "Styling" },
    { name: "React Native", desc: "Mobile App" }
]

export default function AboutView() {
    const [openFAQ, setOpenFAQ] = useState<string | null>(null)
    const lead = teamMembers.find((m) => m.lead)!
    const others = teamMembers.filter((m) => !m.lead)

    return (
        <div className="flex flex-col">
            {/* Hero */}
            <section className="relative overflow-hidden px-4 py-16 sm:py-24">
                <div className="mx-auto max-w-6xl">
                    <div className="relative w-full overflow-hidden rounded-2xl border border-card-border shadow-2xl">
                        <div className="h-[350px] bg-[url('/image/banner.png')] bg-cover bg-center sm:h-[450px]" />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
                            <h1 className="figtree mb-4 text-5xl font-extrabold tracking-tight text-white drop-shadow-lg sm:text-6xl md:text-7xl lg:text-8xl">
                                About{" "}
                                <span className="from-secondary via-error to-secondary bg-gradient-to-r bg-clip-text text-transparent">
                                    Burrow
                                </span>
                            </h1>
                            <p className="max-w-2xl text-lg font-medium text-white/90 drop-shadow-md sm:text-xl">
                                Built by students, for students at the
                                University of Minnesota.
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 flex justify-center">
                        <div className="bg-secondary/10 text-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium">
                            <img
                                src="/image/M_gold.svg"
                                alt="University of Minnesota"
                                className="h-5 w-5"
                            />
                            Made by Gophers, for Gophers
                        </div>
                    </div>
                </div>
            </section>

            {/* Mission */}
            <section className="bg-card/30 px-4 py-24 sm:px-6">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-16 text-center">
                        <h2 className="text-text mb-4 text-3xl font-bold sm:text-4xl md:text-5xl">
                            Our Mission
                        </h2>
                        <p className="text-text/80 mx-auto max-w-2xl text-lg font-medium">
                            Making it easier for students to connect, study, and
                            collaborate — one Burrow at a time.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
                        {[
                            {
                                icon: Heart,
                                title: "Community First",
                                desc: "Burrow exists to bring students together. Whether it's a study session, a club meeting, or a social event — we make it easy."
                            },
                            {
                                icon: BookOpen,
                                title: "Built for Learning",
                                desc: "Find study groups for your exact classes, connect with TAs, and never study alone again."
                            },
                            {
                                icon: Shield,
                                title: "Safe & Verified",
                                desc: "Every user authenticates with their UMN credentials. We take safety seriously and hold all users to University standards."
                            }
                        ].map((item) => (
                            <div
                                key={item.title}
                                className="flex flex-col items-center text-center"
                            >
                                <div className="from-secondary/20 to-secondary/10 mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br">
                                    <item.icon className="text-secondary h-7 w-7" />
                                </div>
                                <h3 className="text-text mb-3 text-xl font-bold">
                                    {item.title}
                                </h3>
                                <p className="text-text/80 text-base">
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team */}
            <section className="px-4 py-24 sm:px-6">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-16 text-center">
                        <h2 className="text-text mb-4 text-3xl font-bold sm:text-4xl md:text-5xl">
                            Meet the Team
                        </h2>
                        <p className="text-text/80 mx-auto max-w-2xl text-lg font-medium">
                            The people behind Burrow
                        </p>
                    </div>

                    {/* Lead */}
                    <div className="mb-12 flex justify-center">
                        <a
                            href={lead.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex flex-col items-center text-center"
                        >
                            <div className="relative mb-4">
                                <img
                                    src={lead.image}
                                    alt={lead.name}
                                    className="ring-secondary/40 h-32 w-32 rounded-full object-cover ring-4 transition-all duration-300 group-hover:ring-8"
                                />
                                <div className="bg-secondary absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-full shadow-lg transition-transform group-hover:scale-110">
                                    <ExternalLink className="h-4 w-4 text-white" />
                                </div>
                            </div>
                            <h3 className="text-text text-xl font-bold">
                                {lead.name}
                            </h3>
                            <p className="text-text/60 text-sm font-medium">
                                {lead.role}
                            </p>
                            <span className="bg-secondary/15 text-secondary mt-2 rounded-full px-3 py-1 text-xs font-bold">
                                Project Lead
                            </span>
                        </a>
                    </div>

                    {/* Others */}
                    <div className="grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-4">
                        {others.map((member) => (
                            <a
                                key={member.name}
                                href={member.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group flex flex-col items-center text-center"
                            >
                                <div className="relative mb-4">
                                    <img
                                        src={member.image}
                                        alt={member.name}
                                        className="ring-card-border h-24 w-24 rounded-full object-cover ring-2 transition-all duration-300 group-hover:ring-4"
                                    />
                                    <div className="bg-primary absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full opacity-0 shadow-lg transition-all group-hover:opacity-100">
                                        <ExternalLink className="h-3.5 w-3.5 text-white" />
                                    </div>
                                </div>
                                <h3 className="text-text font-semibold">
                                    {member.name}
                                </h3>
                                <p className="text-text/60 text-sm">
                                    {member.role}
                                </p>
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            {/* Tech Stack */}
            <section className="bg-card/30 px-4 py-24 sm:px-6">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-16 text-center">
                        <h2 className="text-text mb-4 text-3xl font-bold sm:text-4xl md:text-5xl">
                            How it's built
                        </h2>
                        <p className="text-text/80 mx-auto max-w-2xl text-lg font-medium">
                            Open source and built with modern tools.{" "}
                            <a
                                href="https://github.com/ajkneisl/burrow"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-secondary font-semibold hover:underline"
                            >
                                View on GitHub
                            </a>
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
                        {techStack.map((tech) => (
                            <div
                                key={tech.name}
                                className="border-card-border bg-card flex flex-col items-center rounded-xl border p-4 text-center"
                            >
                                <span className="text-text text-sm font-semibold">
                                    {tech.name}
                                </span>
                                <span className="text-text/50 text-xs">
                                    {tech.desc}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="px-4 py-24 sm:px-6">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-16 text-center">
                        <h2 className="text-text mb-4 text-3xl font-bold sm:text-4xl md:text-5xl">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-text/80 text-lg font-medium">
                            Everything you need to know about Burrow
                        </p>
                    </div>

                    <div className="mx-auto max-w-3xl space-y-3">
                        {faqItems.map((item) => {
                            const isOpen = openFAQ === item.id
                            return (
                                <div
                                    key={item.id}
                                    className={`border-card-border overflow-hidden rounded-xl border transition-colors ${isOpen ? "bg-card" : "bg-card/50 hover:bg-card"}`}
                                >
                                    <button
                                        onClick={() =>
                                            setOpenFAQ(
                                                isOpen ? null : item.id
                                            )
                                        }
                                        className="text-text flex w-full cursor-pointer items-center gap-4 px-6 py-5 text-left"
                                    >
                                        <div className="bg-secondary/10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                                            <item.icon className="text-secondary h-4 w-4" />
                                        </div>
                                        <span className="flex-1 font-medium">
                                            {item.question}
                                        </span>
                                        <ChevronDown
                                            className={`text-text/40 h-5 w-5 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                                        />
                                    </button>
                                    <div
                                        className={`grid transition-all duration-300 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                                    >
                                        <div className="overflow-hidden">
                                            <div className="text-text/70 px-6 pb-5 pl-[4.75rem] leading-relaxed">
                                                {item.answer}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="bg-card/30 px-4 py-24 sm:px-6">
                <div className="mx-auto max-w-3xl text-center">
                    <h2 className="text-text mb-6 text-3xl font-bold sm:text-4xl md:text-5xl">
                        Have questions or feedback?
                    </h2>
                    <p className="text-text/80 mb-8 text-lg font-medium">
                        We'd love to hear from you. Reach out anytime.
                    </p>
                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                        <a
                            href="mailto:support@umn.app"
                            className="bg-primary hover:bg-primary-hover inline-flex items-center gap-2 rounded-full px-8 py-3 font-semibold text-white transition-colors"
                        >
                            <MessageSquare className="h-4 w-4" />
                            Contact Us
                        </a>
                        <Link
                            to="/browse"
                            className="text-text/80 hover:text-text inline-flex items-center gap-2 font-medium transition-colors"
                        >
                            Browse Burrows →
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    )
}