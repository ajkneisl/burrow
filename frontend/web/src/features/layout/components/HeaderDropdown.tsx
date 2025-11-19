import { useRef, useState } from "react"
import { useAtom } from "jotai"
import { authToken } from "@features/auth/auth.atom.ts"
import { themeAtom } from "@api/theme.atom.ts"
import { Dropdown, DropdownItem } from "@umnburrow/core"
import HeaderButton from "@features/layout/components/HeaderButton.tsx"
import { problemModalOpen } from "@features/problem/problem.atom.ts"
import { useNavigate } from "react-router"
import { myInvitesModalOpen } from "@features/layout/layout.atom.ts"
import {
    MenuIcon,
    Settings,
    Mail,
    Sun,
    AlertTriangle,
    LogOut
} from "lucide-react"

/**
 * Animation variants for {@link HeaderDropdown}
 */

export default function HeaderDropdown() {
    const nav = useNavigate()

    const [, setAuth] = useAtom(authToken)
    const [theme, setTheme] = useAtom(themeAtom)
    const [open, setOpen] = useState(false)
    const [, setProblemOpen] = useAtom(problemModalOpen)
    const [, setMyInvitesOpen] = useAtom(myInvitesModalOpen)

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
                        label="My Invites"
                        onSelect={() => {
                            setOpen(false)
                            setMyInvitesOpen(true)
                        }}
                        rightIcon={<Mail width="18" height="18" />}
                    />

                    {/* theme */}
                    <DropdownItem
                        label={`${theme ? "Light" : "Dark"} Mode`}
                        onSelect={() => {
                            setTheme((prev) => !prev)
                            setOpen(false)
                        }}
                        rightIcon={<Sun width="18" height="18" />}
                    />

                    {/* theme */}
                    <DropdownItem
                        label={`Feedback`}
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
