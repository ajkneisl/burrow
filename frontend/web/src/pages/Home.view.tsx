import { useEffect, useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router"
import useToken from "@features/auth/hooks/useToken.ts"
import PreviewGroupMeetings from "@features/groups/components/PreviewGroupMeetings.tsx"
import { useAtom } from "jotai"
import { newUser } from "@features/auth/auth.atom.ts"
import NewUserIntro from "@features/auth/components/NewUserIntro.tsx"
import MeetingsSection from "@features/groups/components/MeetingsSection.tsx"
import { getBookmarks, getSchedule } from "@features/groups/groups.api.ts"

/**
 * The homepage `/`.
 *
 * @constructor
 */
export default function HomeView() {
    const nav = useNavigate()
    const [params] = useSearchParams()

    const auth = useToken()
    const [isNewUser] = useAtom(newUser)

    const showNewUser = useMemo(
        () => isNewUser || params.has("new"),
        [isNewUser, params]
    )

    useEffect(() => {
        // if the location is 9 or 17 then they're viewing a meeting
        // for example `/abcdefg` or `/meeting/abcdefg`
        if (
            auth === null &&
            window.location.pathname.length !== 9 &&
            window.location.hostname.length !== 17
        ) {
            nav("/welcome")
        }
    }, [auth, nav])

    if (!auth || auth === "") {
        return <p></p>
    }

    return (
        <div className="w-full mx-auto px-4 md:px-6 py-6 grid grid-cols-3 gap-6">
            {/* show intro only if it's a new user*/}
            {showNewUser && <NewUserIntro />}

            <section
                aria-label="Group discovery"
                className="col-span-3 lg:col-span-2 space-y-6 mt-4"
            >
                <PreviewGroupMeetings
                    title={"Upcoming Study Groups"}
                    fullPage={"/study"}
                    kind={"STUDY"}
                    amount={3}
                />
            </section>

            <aside
                aria-label="Utilities"
                className="col-span-3 lg:col-span-1 space-y-6"
            >
                <MeetingsSection
                    title="My Schedule"
                    queryKey={["schedule"]}
                    queryFn={() => getSchedule(auth)}
                    emptyText="You have no upcoming meetings."
                />

                <MeetingsSection
                    title="My Bookmarks"
                    queryKey={["bookmarks"]}
                    queryFn={() => getBookmarks(auth)}
                    emptyText="You have no bookmarks."
                />
            </aside>
        </div>
    )
}
