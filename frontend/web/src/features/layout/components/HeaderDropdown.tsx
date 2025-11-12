import { useRef, useState } from "react"
import { useAtom } from "jotai"
import { authToken } from "@features/auth/auth.atom.ts"
import { themeAtom } from "@api/theme.atom.ts"
import { Dropdown, DropdownItem } from "@umnburrow/core"
import HeaderButton from "@features/layout/components/HeaderButton.tsx"
import { settingsModalOpen } from "@features/sync/settings/settings.atom.ts"
import { problemModalOpen } from "@features/problem/problem.atom.ts"
import { useNavigate } from "react-router"
import { myInvitesModalOpen } from "@features/layout/layout.atom.ts"

/**
 * Animation variants for {@link HeaderDropdown}
 */

export default function HeaderDropdown() {
    const nav = useNavigate()

    const [, setAuth] = useAtom(authToken)
    const [theme, setTheme] = useAtom(themeAtom)
    const [open, setOpen] = useState(false)
    const [, setSettingsOpen] = useAtom(settingsModalOpen)
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
                icon={
                    // sandwich lookin dropdown
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <line x1="4" y1="6" x2="20" y2="6" />
                        <line x1="4" y1="12" x2="20" y2="12" />
                        <line x1="4" y1="18" x2="20" y2="18" />
                    </svg>
                }
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
                            setSettingsOpen(true)
                        }}
                        rightIcon={
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle cx="12" cy="12" r="3" />
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 5 15.4a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8 4.6 1.65 1.65 0 0 0 9.49 3H9.6a2 2 0 1 1 4 0v.09c0 .66.38 1.26 1 1.51.5.2 1.08.09 1.51-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.42.43-.53 1.01-.33 1.51.25.62.85 1 1.51 1H21a2 2 0 1 1 0 4h-.09c-.66 0-1.26.38-1.51 1Z" />
                            </svg>
                        }
                    />

                    {/* my invites */}
                    <DropdownItem
                        label="My Invites"
                        onSelect={() => {
                            setOpen(false)
                            setMyInvitesOpen(true)
                        }}
                        rightIcon={
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <rect
                                    x="3"
                                    y="4"
                                    width="18"
                                    height="16"
                                    rx="2"
                                />
                                <path d="m3 4 9 6 9-6" />
                            </svg>
                        }
                    />

                    {/* theme */}
                    <DropdownItem
                        label={`${theme ? "Light" : "Dark"} Mode`}
                        onSelect={() => {
                            setTheme((prev) => !prev)
                            setOpen(false)
                        }}
                        rightIcon={
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <circle cx="12" cy="12" r="4" />
                                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                            </svg>
                        }
                    />

                    {/* theme */}
                    <DropdownItem
                        label={`Feedback`}
                        onSelect={() => {
                            setProblemOpen((prev) => !prev)
                            setOpen(false)
                        }}
                        rightIcon={
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                        }
                    />

                    {/* logout */}
                    <DropdownItem
                        label="Log out"
                        onSelect={() => {
                            setAuth("")
                                .then(() => setOpen(false))
                                .then(() => nav("/welcome"))
                        }}
                        rightIcon={
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                        }
                    />
                </Dropdown>
            </div>
        </div>
    )
}
