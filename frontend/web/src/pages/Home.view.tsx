import { useEffect, useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router"
import useToken from "@features/auth/hooks/useToken.ts"
import PreviewGroupMeetings from "@features/burrows/components/PreviewGroupMeetings.tsx"
import { useAtom } from "jotai"
import { newUser } from "@features/auth/auth.atom.ts"
import NewUserIntro from "@features/auth/components/NewUserIntro.tsx"
import MeetingsSection from "@features/burrows/components/MeetingsSection.tsx"
import { getSchedule } from "@features/burrows/burrows.api.ts"
import MyProfile from "@features/profile/components/MyProfile.tsx"
import {PushNotificationToggle} from "@features/notifications/components/PushNotificationToggle.tsx";

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
        <div className="mx-auto flex w-full grid-cols-4 flex-col gap-6 px-4 py-6 md:grid md:px-6">
            {/* show intro only if it's a new user*/}
            {showNewUser && <NewUserIntro />}

            <PushNotificationToggle />

            {/* left side profile */}
            <aside className="col-span-1">
                <MyProfile />
            </aside>

            {/* middle schedule */}
            <section className="col-span-2">
                <MeetingsSection
                    queryKey={["schedule"]}
                    queryFn={() => getSchedule(auth)}
                    emptyText="You have no upcoming Burrows."
                />
            </section>

            <div className="border-text/10 block border-t md:hidden" />

            {/* right side upcoming study burrows*/}
            <aside className="col-span-1">
                <PreviewGroupMeetings
                    fullPage={"/study"}
                    kind={"STUDY"}
                    amount={5}
                />
            </aside>
        </div>
    )
}
