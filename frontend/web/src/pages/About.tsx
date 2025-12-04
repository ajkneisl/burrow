import { type ReactNode, useState } from "react"
import { ChevronDown, ExternalLink } from "lucide-react"
import { Link } from "react-router"

// the frequently asked questions
const faqItems: {
    id: string
    question: string
    answer: ReactNode
}[] = [
    {
        id: "how-find",
        question: "How do I find a study group?",
        answer: (
            <>
                You can find a study group by searching on the{" "}
                <Link
                    to="/"
                    className="font-medium text-secondary hover:underline"
                >
                    home page
                </Link>
                . You can also{" "}
                <Link
                    to="/browse"
                    className="font-medium text-secondary hover:underline"
                >
                    browse all burrows
                </Link>{" "}
                and search for relevant coursework or topics.
            </>
        )
    },
    {
        id: "how-built",
        question: "How was Burrow built?",
        answer: (
            <>
                Burrow was built using Kotlin & Ktor for the backend, paired
                with MinIO for image hosting and PostgreSQL for the database.
                The frontend uses React with TypeScript and TailwindCSS. You can
                view Burrow's code in its entirety on our{" "}
                <a
                    href="https://github.com/ajkneisl/burrow"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary font-medium hover:underline"
                >
                    GitHub
                </a>
                .
            </>
        )
    },
    {
        id: "how-create",
        question: "How do I create my own Burrow?",
        answer: (
            <>
                Click the "Create" on the top of the site on Desktop, or the "+"
                on bottom right on Mobile, and choose your wanted type of
                Burrow. Then, follow through the process and fill in the correct
                details.
            </>
        )
    },
    {
        id: "how-join",
        question: "How do I join a Burrow?",
        answer: (
            <>
                Once you find a Burrow you're interested in, click the Burrow
                and find the "Join" button. If the Burrow is already full (the
                capacity of the Burrow will not be green), you will be added to
                the waitlist and moved into the Burrow when there's space.
                Otherwise, you're in the Burrow and can begin chatting with
                other members.
            </>
        )
    },
    {
        id: "safety",
        question: "What are the safety measures?",
        answer: (
            <>
                We take your safety seriously. All users must authenticate with
                their University of Minnesota credentials and are held to the
                standards of the University of Minnesota. If we have concerns
                over safety or usage of Burrow, we may report behaviour to the
                University. If you have any concerns, please email us at{" "}
                <a
                    href="mailto:support@umn.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-secondary font-medium hover:underline"
                >
                    support@umn.app
                </a>
                .
            </>
        )
    },
    {
        id: "how-cancel",
        question: "How do I cancel a Burrow?",
        answer: (
            <>
                Navigate to your Burrow's page and click the "Delete". You'll be
                asked to confirm your option, and if so, the Burrow will be
                deleted and the members will not be notified.
            </>
        )
    },
    {
        id: "how-report",
        question: "How do I report a problem or member?",
        answer: (
            <>
                Press the menu in the top right of the site, and press "Give
                Feedback". Here, you can tell us anything, including problems
                with a user, Burrow, or the website itself. If further
                discussion is required, we will email you and contintue the
                conversation.
            </>
        )
    }
]

// all tema members
const teamMembers = [
    {
        name: "AJ Kneisl",
        role: "Project Lead",
        image: "https://media.licdn.com/dms/image/v2/D4E03AQGT_Ldmt0E6Kw/profile-displayphoto-crop_800_800/B4EZgV.cvDHEAI-/0/1752715349325?e=1765411200&v=beta&t=CxcxaCEJGtOWHlACrRyY0tV8gkQFdzYFHeYqXM7tM88",
        linkedin: "https://www.linkedin.com/in/ajkn/",
        lead: true
    },
    {
        name: "Joshua Westerlund",
        role: "Design & Outreach",
        image: "https://media.licdn.com/dms/image/v2/D4D03AQFCD2cI2Xre6A/profile-displayphoto-shrink_400_400/B4DZZkHO1HG0Ag-/0/1745436340497?e=1765411200&v=beta&t=zH-Hjuz4XzsjIllWroKNbOkmCo3efvKJnQ3cNo-Z-VY",
        linkedin: "https://www.linkedin.com/in/weste637/"
    },
    {
        name: "Yordanos Eshete",
        role: "Frontend Developer & Outreach",
        image: "https://media.licdn.com/dms/image/v2/D5603AQG7O6l6A-4I9g/profile-displayphoto-scale_400_400/B56Zpfpt44J8Ag-/0/1762541363865?e=1765411200&v=beta&t=LyBxJPH9YxNOSgT02Hrl-xgzXbrAJcfjfJjF_ParZp8",
        linkedin: "https://www.linkedin.com/in/yordanoseshete/"
    },
    {
        name: "Ben Stortroen",
        role: "Frontend Developer",
        image: "https://media.licdn.com/dms/image/v2/D4E03AQGixrra3miq3g/profile-displayphoto-shrink_800_800/B4EZR4XfynGgAc-/0/1737186213397?e=1765411200&v=beta&t=V_96vF_0cR1weSo_FR6O3R8B0YvokV4fEh1kdy-UAUY",
        linkedin: "https://www.linkedin.com/in/benjamin-stortroen-b61400347/"
    },
    {
        name: "Thien-Tri Nguyen",
        role: "Design & Frontend Developer",
        image: "https://media.licdn.com/dms/image/v2/D4E03AQGay0bvqdcevA/profile-displayphoto-crop_800_800/B4EZoAJEUfJ0AI-/0/1760938970089?e=1765411200&v=beta&t=yS6Go62tOjrMKpng-RrOvdWfaJCo2JaKkVkJnqogTZ8",
        linkedin: "https://www.linkedin.com/in/thientri-nguyen/"
    }
]

/**
 * About page.
 *
 * @author AJ Kneisl, Yordanos Eshete
 */
export default function About() {
    const [openFAQ, setOpenFAQ] = useState<string | null>(null)
    const leadMember = teamMembers.find((m) => m.lead)
    const otherMembers = teamMembers.filter((m) => !m.lead)

    return (
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-16">
            {/* hero */}
            <section className="relative mb-20 overflow-hidden rounded-3xl shadow-2xl">
                <div className="h-64 w-full bg-[url('/image/banner.png')] bg-cover sm:h-80" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
                    <h1 className="figtree mb-4 text-6xl font-extrabold tracking-tight text-white drop-shadow-2xl sm:text-7xl md:text-8xl">
                        Burrow
                    </h1>
                    <p className="max-w-2xl text-lg font-medium text-white/90 drop-shadow-lg sm:text-xl">
                        Connecting students, one burrow at a time
                    </p>
                </div>
            </section>

            {/* mission */}
            <section className="mb-24">
                <div className="bg-gradient-to-br from-primary/5 via-secondary/5 to-primary/5 rounded-3xl p-8 sm:p-12">
                    <div className="mx-auto max-w-3xl text-center">
                        <h2 className="text-text mb-6 text-3xl font-bold sm:text-4xl">
                            Our Mission
                        </h2>
                        <p className="text-text/80 text-lg leading-relaxed sm:text-xl">
                            Burrow is built{" "}
                            <span className="text-secondary font-semibold">
                                by students at the University of Minnesota
                            </span>
                            , for students at the University of Minnesota. Our
                            goal is to make studying and connecting with one
                            another easier. Whether that's a group study
                            session, a club meeting, or a social event, Burrow
                            helps keep things organized and collaborative.
                        </p>
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="mb-24">
                <div className="mb-12 text-center">
                    <h2 className="text-text mb-3 text-3xl font-bold sm:text-4xl">
                        Meet the Team
                    </h2>
                </div>

                <div className="flex flex-col items-center gap-8">
                    {/* lead member */}
                    {leadMember && (
                        <div className="w-full max-w-sm">
                            <a
                                href={leadMember.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="from-secondary/10 to-primary/10 border-secondary/20 hover:border-secondary/40 group block overflow-hidden rounded-3xl border-2 bg-gradient-to-br p-8 text-center shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
                            >
                                <div className="relative mx-auto mb-6 h-32 w-32">
                                    <img
                                        src={leadMember.image}
                                        alt={leadMember.name}
                                        className="ring-secondary/30 h-full w-full rounded-full object-cover ring-4 transition-all duration-300 group-hover:ring-8"
                                    />
                                    <div className="bg-secondary absolute -right-2 -bottom-2 flex h-10 w-10 items-center justify-center rounded-full shadow-xl transition-all duration-300 group-hover:scale-110">
                                        <ExternalLink className="h-5 w-5 text-white" />
                                    </div>
                                </div>
                                <h3 className="text-text mb-2 text-2xl font-bold">
                                    {leadMember.name}
                                </h3>
                                <p className="text-text/70 mb-3 text-base font-medium">
                                    {leadMember.role}
                                </p>
                                <span className="bg-secondary/20 text-secondary inline-block rounded-full px-4 py-1.5 text-sm font-bold">
                                    Project Lead
                                </span>
                            </a>
                        </div>
                    )}

                    {/* rest of the team members */}
                    <div className="grid w-full grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
                        {otherMembers.map((member) => (
                            <a
                                key={member.name}
                                href={member.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-card/50 hover:bg-card border-card-border group block overflow-hidden rounded-2xl border p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                            >
                                <div className="relative mx-auto mb-4 h-24 w-24">
                                    <img
                                        src={member.image}
                                        alt={member.name}
                                        className="ring-card-border h-full w-full rounded-full object-cover ring-2"
                                    />
                                    <div className="bg-primary absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full opacity-0 shadow-lg transition-all duration-300 group-hover:opacity-100">
                                        <ExternalLink className="h-3.5 w-3.5 text-white" />
                                    </div>
                                </div>
                                <h3 className="text-text font-semibold">
                                    {member.name}
                                </h3>
                                <p className="text-text/50 text-sm">
                                    {member.role}
                                </p>
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            {/* faq section */}
            <section>
                <div className="mb-12 text-center">
                    <h2 className="text-text mb-3 text-3xl font-bold sm:text-4xl">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-text/60 text-lg">
                        Everything you need to know about Burrow
                    </p>
                </div>

                <div className="mx-auto max-w-3xl space-y-4">
                    {faqItems.map((item) => {
                        const isOpen = openFAQ === item.id
                        return (
                            <div
                                key={item.id}
                                className={`border-card-border overflow-hidden rounded-xl border transition-colors ${
                                    isOpen
                                        ? "bg-card"
                                        : "bg-card/50 hover:bg-card"
                                }`}
                            >
                                <button
                                    onClick={() =>
                                        setOpenFAQ(isOpen ? null : item.id)
                                    }
                                    className="text-text flex w-full cursor-pointer items-center justify-between px-6 py-5 text-left transition-colors"
                                >
                                    <span className="pr-4 font-medium">
                                        {item.question}
                                    </span>
                                    <ChevronDown
                                        className={`text-text/40 h-5 w-5 shrink-0 transition-transform duration-300 ${
                                            isOpen ? "rotate-180" : ""
                                        }`}
                                    />
                                </button>
                                <div
                                    className={`grid transition-all duration-300 ease-out ${
                                        isOpen
                                            ? "grid-rows-[1fr]"
                                            : "grid-rows-[0fr]"
                                    }`}
                                >
                                    <div className="overflow-hidden">
                                        <div className="text-text/70 px-6 pb-5 leading-relaxed">
                                            {item.answer}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </section>
        </div>
    )
}
