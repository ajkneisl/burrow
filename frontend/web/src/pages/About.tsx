import {
    Button,
    Disclosure,
    DisclosureGroup,
    DisclosurePanel,
    Heading
} from "react-aria-components"
import clsx from "clsx"

// A simple chevron icon for the disclosure
function ChevronDownIcon(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m6 9 6 6 6-6" />
        </svg>
    )
}

// An array to hold the FAQ content
const faqItems = [
    {
        id: "how-find",
        question: "How do I find a study group?",
        answer: "You can find a study group by searching for it on the home page. You can also search for a specific course by clicking the 'Search' button, and searching for relevant coursework or topics."
    },
    {
        id:"ta-led",
        question: "Can I find out if a TA is leading a study group?",
        answer: "The leader of any Study Group will be stated on the banner, if it is a TA, they will have a badge next to their name and profile."
    },
    {
        id: "how-create",
        question: "How do I create my own study group?",
        answer: "Go to the 'Create a Group' page. You'll need to fill in your course, the location (e.g., 'Wilson Library, 2nd Floor'), and the date/time. Your group will then be visible to other students in that course."
    },
    {
        id: "delete-group",
        question: "How do I delete my group?",
        answer: (
            <div className="flex flex-col gap-4">
                <p>
                    In order to delete a group, you must be the owner of the
                    group. To do so, navigate to the group you created and click
                    the 'Delete Group' button on the group's page. You will be
                    prompted to confirm your action.
                </p>
                <img
                    src="/delete-group.png"
                    alt="Delete group screenshot"
                    className="border-border rounded-lg border"
                />
            </div>
        )
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
        question: "If I leave a group, will I be removed from the waiting list?",
        answer:"Yes, leaving a group will remove you from the waiting list. If you are the leader of the group, you will be removed from the group."
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

export default function About() {
    return (
        <div className="flex flex-col justify-center items-center mx-auto w-full p-4">
            {/* big gohher */}
            <div className="lg:min-w-6xl relative mt-8 w-full overflow-hidden rounded-2xl">
                <div className="h-[16rem] w-full bg-[url('/realgopher.png')] bg-[position:center_calc(100%+300px)]" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 text-center">
                    <h1 className="figtree text-7xl font-extrabold tracking-tight text-secondary drop-shadow-md">
                        Burrow
                    </h1>
                </div>
            </div>

            <p className="text-lg text-center mb-12 mt-8 text-gray-400 max-w-xl">
                Burrow is a website built by students at the University of
                Minnesota, for students at the University of Minnesota to make
                studying and connecting with one another easier. Our goal is to
                help make setting up events easier, whether that's a group study
                session, a club meeting, or even a function, Burrow was designed
                to help keep things organized.
            </p>
            <Heading className="text-3xl font-bold text-center mb-8">
                Frequently Asked Questions
            </Heading>

            <DisclosureGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-7xl">
                {faqItems.map((item) => (
                    <Disclosure
                        key={item.id}
                        id={item.id}
                        className="bg-card w-full overflow-hidden rounded-lg shadow-sm"
                    >
                        {({ isExpanded }) => (
                            <>
                                <Heading level={2}>
                                    <Button
                                        slot={"trigger"}
                                        className="text-text hover:bg-card-hover focus-visible:ring-primary-500 flex w-full cursor-pointer items-center justify-between p-5 text-left text-lg font-semibold
                               transition-colors
                               outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                    >
                                        {item.question}
                                        <ChevronDownIcon
                                            className={`h-5 w-5 transition-transform duration-200 ease-in-out ${
                                                isExpanded ? "rotate-180" : ""
                                            }`}
                                        />
                                    </Button>
                                </Heading>

                                <DisclosurePanel
                                    className={clsx(
                                        "prose prose-sm text-text w-full px-5",
                                        isExpanded && "pb-5"
                                    )}
                                >
                                    <p>{item.answer}</p>
                                </DisclosurePanel>
                            </>
                        )}
                    </Disclosure>
                ))}
            </DisclosureGroup>
        </div>
    )
}
