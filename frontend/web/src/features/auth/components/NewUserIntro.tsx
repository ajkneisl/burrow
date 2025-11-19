import useUser from "@features/auth/hooks/useUser.ts"
import { useMemo } from "react"

/**
 * Small intro to Burrow for new users.
 *
 * @author AJ Kneisl
 */
export default function NewUserIntro() {
    const user = useUser()

    const firstName = useMemo(
        () => user?.username?.split(" ")[0],
        [user?.username]
    )

    return (
        <section className="bg-card text-text/80 max-w-content col-span-4 max-w-4xl rounded-2xl p-6 shadow">
            <h1 className="text-text mb-4 text-2xl font-bold">
                Welcome to Burrow, {firstName}!
            </h1>

            <p className="mb-4 text-sm">
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

            <p className="text-text/40 mb-4 text-xs">
                Your name was imported from Google. If you'd like to change it,
                please press the top right menu button and Settings.
            </p>
        </section>
    )
}
