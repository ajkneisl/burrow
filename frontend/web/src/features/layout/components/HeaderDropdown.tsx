import { useRef, useState } from "react"
import { useSetAtom } from "jotai"
import { authToken } from "@features/auth/auth.atom.ts"
import { Dropdown, DropdownItem } from "@umnburrow/core"
import HeaderButton from "@features/layout/components/HeaderButton.tsx"
import { problemModalOpen } from "@features/report/report.atom.ts"
import { useNavigate } from "react-router"
import { myInvitesModalOpen } from "@features/layout/layout.atom.ts"
import {
    MenuIcon,
    Settings,
    Mail,
    AlertTriangle,
    LogOut,
    UserIcon,
    History,
    Map,
    BookOpen
} from "lucide-react"
import useUser from "@features/auth/hooks/useUser.ts"

/**
 * Animation variants for {@link HeaderDropdown}
 *
 * @author AJ Kneisl
 */

export default function HeaderDropdown() {
    const nav = useNavigate()
    const user = useUser()

    const [open, setOpen] = useState(false)

    const setAuth = useSetAtom(authToken)
    const setProblemOpen = useSetAtom(problemModalOpen)
    const setMyInvitesOpen = useSetAtom(myInvitesModalOpen)

    const buttonRef = useRef<HTMLButtonElement | null>(null)

    return (
        <div className="relative inline-block text-left">
            <HeaderButton
                ref={buttonRef}
                type="button"
                aria-haspopup="true"
                aria-expanded={open}
                onClick={() => setOpen((prev) => !prev)}
                icon={<MenuIcon className="h-5 w-5" />}
            />

            <div className="absolute top-full right-0">
                <Dropdown
                    className="-mt-2"
                    btnRef={buttonRef}
                    open={open}
                    onClose={() => setOpen(false)}
                >
                    {/* settings */}
                    <DropdownItem
                        label="Settings"
                        onSelect={() => {
                            setOpen(false)
                            nav("/settings")
                        }}
                        rightIcon={<Settings width="18" height="18" />}
                    />

                    {/* my invites */}
                    <DropdownItem
                        label="Invites"
                        onSelect={() => {
                            setOpen(false)
                            setMyInvitesOpen(true)
                        }}
                        rightIcon={<Mail width="18" height="18" />}
                    />

                    {/* my profile */}
                    <DropdownItem
                        label="Profile"
                        onSelect={() => {
                            setOpen(false)
                            nav(`/user/${user?.username}`)
                        }}
                        rightIcon={<UserIcon width="18" height="18" />}
                    />

                    {/* history */}
                    <DropdownItem
                        label="History"
                        onSelect={() => {
                            setOpen(false)
                            nav("/history")
                        }}
                        rightIcon={<History width="18" height="18" />}
                    />

                    {/* map */}
                    <DropdownItem
                        label={`Map`}
                        onSelect={() => {
                            setOpen(false)
                            nav(`/map`)
                        }}
                        rightIcon={<Map width="18" height="18" />}
                    />

                    {/* articles */}
                    <DropdownItem
                        label="Articles"
                        onSelect={() => {
                            setOpen(false)
                            nav("/articles")
                        }}
                        rightIcon={<BookOpen width="18" height="18" />}
                    />

                    {/* feedback */}
                    <DropdownItem
                        label={`Give Feedback`}
                        onSelect={() => {
                            setProblemOpen((prev) => !prev)
                            setOpen(false)
                        }}
                        rightIcon={<AlertTriangle width="18" height="18" />}
                    />

                    {/* logout */}
                    <DropdownItem
                        label="Log out"
                        onSelect={() => {
                            setAuth("")
                                .then(() => setOpen(false))
                                .then(() => nav("/welcome"))
                        }}
                        rightIcon={<LogOut width="18" height="18" />}
                    />
                </Dropdown>
            </div>
        </div>
    )
}
