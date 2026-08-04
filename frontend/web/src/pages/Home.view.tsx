import { useEffect, useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router"
import useToken from "@features/auth/hooks/useToken.ts"
import PreviewBurrows from "@features/burrows/components/PreviewBurrows.tsx"
import { useAtom } from "jotai"
import { newUser } from "@features/auth/auth.atom.ts"
import NewUserIntro from "@features/auth/components/NewUserIntro.tsx"
import Schedule from "@features/burrows/components/Schedule.tsx"
import MyProfile from "@features/profile/components/MyProfile.tsx"
import MyClubs from "@features/clubs/components/MyClubs.tsx"
import MyFriends from "@features/profile/components/MyFriends.tsx"

/**
 * The homepage of Burrow.
 *
 * @author AJ Kneisl
 */
export default function Home() {
    const nav = useNavigate()
    const [params] = useSearchParams()
    const auth = useToken()

    const [isNewUser] = useAtom(newUser)

    // if the new user display should be shown
    const showNewUser = useMemo(
        () => isNewUser || params.has("new"),
        [isNewUser, params]
    )

    useEffect(() => {
        // if the location is 9 or 17 then they're viewing a Burrow
        // for example `/abcdefg` or `/burrow/abcdefg`
        if (
            (auth === null || auth === "") &&
            window.location.pathname.length !== 9 &&
            window.location.hostname.length !== 15
        ) {
            nav("/welcome")
        }
    }, [auth, nav])

    return (
        <>
            {showNewUser && (
                <div className="my-4 flex w-full items-center justify-center">
                    <NewUserIntro />
                </div>
            )}

            <div className="mx-auto flex w-full max-w-500 grid-cols-3 flex-col gap-6 px-4 py-6 md:grid md:px-6 lg:grid-cols-4">
                {/* profile */}
                <aside className="flex flex-col gap-6 md:col-span-2 md:row-start-1 lg:col-span-1 lg:row-start-1">
                    <MyProfile />

                    <div className="hidden flex-col gap-6 lg:flex">
                        <MyFriends />

                        <MyClubs />
                    </div>
                </aside>

                {/* small border displayed on mobile */}
                <div className="block border-t border-card-border md:hidden" />

                {/* schedule */}
                <section className="md:col-span-2 md:row-start-2 lg:col-span-2 lg:row-start-1">
                    <Schedule />
                </section>

                {/* upcoming burrows */}
                <aside className="md:col-span-1 md:row-span-3 md:row-start-1 lg:col-span-1 lg:row-span-1 lg:row-start-1">
                    <PreviewBurrows amount={5} />
                </aside>
            </div>
        </>
    )
}
