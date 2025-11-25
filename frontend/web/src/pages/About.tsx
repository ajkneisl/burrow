import { useState } from "react"
import { ChevronDown, ExternalLink } from "lucide-react"

const faqItems = [
    {
        id: "how-find",
        question: "How do I find a study group?",
        answer: "You can find a study group by searching for it on the home page. You can also search for a specific course by clicking the 'Search' button, and searching for relevant coursework or topics."
    },
    {
        id: "ta-led",
        question: "Can I find out if a TA is leading a study group?",
        answer: "The leader of any Study Group will be stated on the banner, if it is a TA, they will have a badge next to their name and profile."
    },
    {
        id: "how-create",
        question: "How do I create my own study group?",
        answer: "Go to the 'Create a Group' page. You'll need to fill in your course, the location (e.g., 'Wilson Library, 2nd Floor'), and the date/time. Your group will then be visible to other students in that course."
    },
    {
        id: "how-join",
        question: "How do I join a study group?",
        answer: "Once you find a group you're interested in, you can join it by clicking the 'Join Group' button. You'll be added to the group's waiting list, and will be notified when it's time to meet."
    },
    {
        id: "safety",
        question: "What are the safety measures?",
        answer: "We take your safety seriously. We have a strict policy on how to handle any potential issues with a group. If you have any concerns, please contact us at ajkn.dev."
    },
    {
        id: "how-leave",
        question:
            "If I leave a group, will I be removed from the waiting list?",
        answer: "Yes, leaving a group will remove you from the waiting list. If you are the leader of the group, you will be removed from the group."
    },
    {
        id: "how-cancel",
        question: "How do I cancel a meeting?",
        answer: "Navigate to the group's page and click the 'Cancel Meeting' button. You will be prompted to confirm your action."
    },
    {
        id: "how-report",
        question: "How do I report a member?",
        answer: "Navigate to the member's page and click the 'Report Member' button. You will be prompted to confirm your action, and if applicable, the University will be contacted for further action."
    }
]

const teamMembers = [
    {
        name: "AJ Kneisl",
        role: "Project Lead",
        image: "https://media.licdn.com/dms/image/v2/D4E03AQGT_Ldmt0E6Kw/profile-displayphoto-crop_800_800/B4EZgV.cvDHEAI-/0/1752715349325?e=1765411200&v=beta&t=CxcxaCEJGtOWHlACrRyY0tV8gkQFdzYFHeYqXM7tM88",
        linkedin: "https://www.linkedin.com/in/ajkn/",
        lead: true
    },
    {
        name: "Yordanos Eshete",
        role: "Fullstack Developer",
        image: "https://media.licdn.com/dms/image/v2/D5603AQG7O6l6A-4I9g/profile-displayphoto-scale_400_400/B56Zpfpt44J8Ag-/0/1762541363865?e=1765411200&v=beta&t=LyBxJPH9YxNOSgT02Hrl-xgzXbrAJcfjfJjF_ParZp8",
        linkedin: "https://www.linkedin.com/in/yordanoseshete/"
    },
    {
        name: "Ben Stortroen",
        role: "Fullstack Developer",
        image: "https://media.licdn.com/dms/image/v2/D4E03AQGixrra3miq3g/profile-displayphoto-shrink_800_800/B4EZR4XfynGgAc-/0/1737186213397?e=1765411200&v=beta&t=V_96vF_0cR1weSo_FR6O3R8B0YvokV4fEh1kdy-UAUY",
        linkedin: "https://www.linkedin.com/in/benjamin-stortroen-b61400347/"
    },
    {
        name: "Thien-Tri Nguyen",
        role: "Fullstack Developer",
        image: "https://media.licdn.com/dms/image/v2/D4E03AQGay0bvqdcevA/profile-displayphoto-crop_800_800/B4EZoAJEUfJ0AI-/0/1760938970089?e=1765411200&v=beta&t=yS6Go62tOjrMKpng-RrOvdWfaJCo2JaKkVkJnqogTZ8",
        linkedin: "https://www.linkedin.com/in/thientri-nguyen/"
    },
    {
        name: "Joshua Westerlund",
        role: "UI Designer",
        image: "https://media.licdn.com/dms/image/v2/D4D03AQFCD2cI2Xre6A/profile-displayphoto-shrink_400_400/B4DZZkHO1HG0Ag-/0/1745436340497?e=1765411200&v=beta&t=zH-Hjuz4XzsjIllWroKNbOkmCo3efvKJnQ3cNo-Z-VY",
        linkedin: "https://www.linkedin.com/in/weste637/"
    }
]

function FAQItem({
    question,
    answer,
    isOpen,
    onToggle
}: {
    question: string
    answer: string
    isOpen: boolean
    onToggle: () => void
}) {
    return (
        <div
            className={`border-card-border overflow-hidden rounded-xl border transition-colors ${
                isOpen ? "bg-card" : "bg-card/50 hover:bg-card"
            }`}
        >
            <button
                onClick={onToggle}
                className="text-text flex w-full cursor-pointer items-center justify-between px-6 py-5 text-left transition-colors"
            >
                <span className="pr-4 font-medium">{question}</span>
                <ChevronDown
                    className={`text-text/40 h-5 w-5 shrink-0 transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                    }`}
                />
            </button>
            <div
                className={`grid transition-all duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
            >
                <div className="overflow-hidden">
                    <p className="text-text/60 px-6 pb-5 leading-relaxed">
                        {answer}
                    </p>
                </div>
            </div>
        </div>
    )
}

function TeamCard({
    name,
    role,
    image,
    linkedin,
    lead
}: {
    name: string
    role: string
    image: string
    linkedin: string
    lead?: boolean
}) {
    return (
        <a
            href={linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-card/50 hover:bg-card border-card-border group block overflow-hidden rounded-2xl border p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
        >
            <div className="relative mx-auto mb-4 h-24 w-24">
                <img
                    src={image}
                    alt={name}
                    className="ring-card-border h-full w-full rounded-full object-cover ring-2"
                />
                <div className="bg-primary absolute -right-1 -bottom-1 flex h-7 w-7 items-center justify-center rounded-full opacity-0 shadow-lg transition-all duration-300 group-hover:opacity-100">
                    <ExternalLink className="h-3.5 w-3.5 text-white" />
                </div>
            </div>
            <h3 className="text-text font-semibold">{name}</h3>
            <p className="text-text/50 text-sm">{role}</p>
            {lead && (
                <span className="bg-primary/10 text-primary mt-2 inline-block rounded-full px-3 py-0.5 text-xs font-medium">
                    Lead
                </span>
            )}
        </a>
    )
}

export default function About() {
    const [openFAQ, setOpenFAQ] = useState<string | null>(null)
    const leadMember = teamMembers.find((m) => m.lead)
    const otherMembers = teamMembers.filter((m) => !m.lead)

    return (
        <div className="mx-auto w-full max-w-5xl px-4 py-12">
            {/* Hero */}
            <section className="relative mb-6 overflow-hidden rounded-3xl">
                <div className="h-52 w-full bg-[url('/image/banner.png')] bg-cover bg-[position:center_calc(100%+280px)]" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-12">
                    <h1 className="figtree text-secondary text-6xl font-extrabold tracking-tight drop-shadow-lg sm:text-7xl">
                        Burrow
                    </h1>
                </div>
            </section>

            {/* Mission */}
            <section className="mb-8">
                <p className="text-text/70 mx-auto max-w-2xl text-center text-lg leading-relaxed">
                    Burrow is built by students at the University of Minnesota,
                    for students at the University of Minnesota. Our goal is to
                    make studying and connecting with one another easier.
                    Whether that's a group study session, a club meeting, or a
                    social event, Burrow helps keep things organized.
                </p>
            </section>

            {/* Team */}
            <section className="mb-8">
                <h2 className="text-text mb-2 text-center text-2xl font-bold">
                    Meet the Team
                </h2>
                <p className="text-text/50 mb-10 text-center">
                    The people behind Burrow
                </p>

                <div className="flex flex-col items-center gap-6">
                    {/* Lead */}
                    {leadMember && (
                        <div className="w-full max-w-[200px]">
                            <TeamCard {...leadMember} />
                        </div>
                    )}

                    {/* Other members */}
                    <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
                        {otherMembers.map((member) => (
                            <TeamCard key={member.name} {...member} />
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section>
                <h2 className="text-text mb-2 text-center text-2xl font-bold">
                    Frequently Asked Questions
                </h2>
                <p className="text-text/50 mb-10 text-center">
                    Everything you need to know about Burrow
                </p>

                <div className="mx-auto max-w-2xl space-y-3">
                    {faqItems.map((item) => (
                        <FAQItem
                            key={item.id}
                            question={item.question}
                            answer={item.answer}
                            isOpen={openFAQ === item.id}
                            onToggle={() =>
                                setOpenFAQ(openFAQ === item.id ? null : item.id)
                            }
                        />
                    ))}
                </div>
            </section>
        </div>
    )
}
