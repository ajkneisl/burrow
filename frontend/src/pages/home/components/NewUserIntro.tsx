import useUser from "@features/auth/api/hooks/useUser.ts"
import { useMemo } from "react"

/**
 * Small intro to Burrow for new users.
 */
export default function NewUserIntro() {
    const user = useUser()

    const firstName = useMemo(() => user?.name?.split(" ")[0], [user?.name])

    return (
        <section className="bg-card rounded-2xl shadow p-6 col-span-3 text-text/80 max-w-content max-w-4xl">
            <h1 className="text-2xl font-bold mb-4 text-text">
                Welcome to Burrow, {firstName}!
            </h1>

            <p className="mb-4">
                Burrow helps students find study groups and connect with other
                students to enhance their learning experience, based on shared
                interests, classes, or anything in-between.
                <br />
                <br />
                To join a study group, you can search above by class, name, or
                tag, or look below and view all available study groups. Select
                the group, then press Enter to add it to your schedule.
                <br />
                <br />
                To create your own meeting, press Create Burrow, fill out the
                details, and see how many people join your Burrow.
            </p>

            <p className="mb-4 text-xs">
                Your name was imported from Google. If you'd like to change it,
                please press the top right menu button and Settings.
            </p>
        </section>
    )
}
