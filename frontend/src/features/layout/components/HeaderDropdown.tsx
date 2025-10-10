import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, type Variants } from "framer-motion"
import { useNavigate } from "react-router"
import { useAtom } from "jotai"
import { authToken } from "@features/auth/api/auth.atom.ts"
import { themeAtom } from "@api/theme.atom.ts"

/**
 * Animation variants for {@link HeaderDropdown}
 */
const menuVariants: Variants = {
    hidden: { opacity: 0, y: -6, scale: 0.98 },
    show: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            type: "spring",
            stiffness: 420,
            damping: 28,
            mass: 0.2,
            delayChildren: 0.03
        }
    },
    exit: { opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.12 } }
}

/**
 * The dropdown menu seen in the header.
 * @constructor
 */
export default function HeaderDropdown() {
    const nav = useNavigate()

    const [theme, setTheme] = useAtom(themeAtom)

    const [open, setOpen] = useState(false)
    const [, setAuth] = useAtom(authToken)
    const btnRef = useRef<HTMLButtonElement | null>(null)
    const menuRef = useRef<HTMLDivElement | null>(null)

    // when to exit the page
    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (!open) return
            const target = e.target as Node
            if (
                menuRef.current?.contains(target) ||
                btnRef.current?.contains(target)
            )
                return
            setOpen(false)
        }

        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false)
        }

        document.addEventListener("mousedown", onDocClick)
        document.addEventListener("keydown", onKey)
        return () => {
            document.removeEventListener("mousedown", onDocClick)
            document.removeEventListener("keydown", onKey)
        }
    }, [open])

    // focus it when it opens :o
    useEffect(() => {
        if (open) {
            const first =
                menuRef.current?.querySelector<HTMLElement>("[role='menuitem']")
            first?.focus()
        }
    }, [open])

    return (
        <div className="relative inline-block text-left">
            <motion.button
                ref={btnRef}
                type="button"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen((s) => !s)}
                className="cursor-pointer inline-flex items-center justify-center rounded-md p-2 text-white hover:bg-[#5b0013] focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 600, damping: 32 }}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
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
            </motion.button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        ref={menuRef}
                        role="menu"
                        aria-label="Overflow menu"
                        className="absolute right-0 z-20 mt-2 w-56 origin-top-right rounded-xl bg-card p-1.5 shadow-lg ring-1 ring-black/5"
                        variants={menuVariants}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                    >
                        {/* Settings */}
                        <MenuItem
                            label="Settings"
                            onSelect={() => {
                                nav("/settings")
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
                                    <circle cx="12" cy="12" r="3" />
                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 5 15.4a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 8 4.6 1.65 1.65 0 0 0 9.49 3H9.6a2 2 0 1 1 4 0v.09c0 .66.38 1.26 1 1.51.5.2 1.08.09 1.51-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.42.43-.53 1.01-.33 1.51.25.62.85 1 1.51 1H21a2 2 0 1 1 0 4h-.09c-.66 0-1.26.38-1.51 1Z" />
                                </svg>
                            }
                        />

                        {/* Change Theme */}
                        <MenuItem
                            label={`${theme ? "Light" : "Dark"} Mode`}
                            onSelect={() => setTheme((prev) => !prev)}
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

                        {/* Log out  */}
                        <MenuItem
                            label="Log out"
                            onSelect={() => {
                                setAuth("")
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
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                            }
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

/**
 * Animation variants for {@link MenuItem}
 */
const itemVariants: Variants = {
    hidden: { opacity: 0, y: -4 },
    show: {
        opacity: 1,
        y: 0,
        transition: { type: "spring", stiffness: 500, damping: 30 }
    },
    exit: { opacity: 0, y: -4 }
}

/**
 * {@link MenuItem}
 */
type MenuItemProps = {
    label: string
    onSelect: () => void
    rightIcon?: React.ReactNode
}

/**
 * A menu item in {@link HeaderDropdown}.
 *
 * @param label The label for the menu item.
 * @param onSelect When this button is selected.
 * @param rightIcon Optional icon displayed on the right side.
 * @constructor
 */
function MenuItem({ label, onSelect, rightIcon }: MenuItemProps) {
    return (
        <motion.button
            role="menuitem"
            onClick={onSelect}
            className="flex w-full cursor-pointer select-none items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm text-text hover:bg-background"
            variants={itemVariants}
            whileTap={{ scale: 0.98 }}
        >
            <span className="truncate flex-1">{label}</span>
            {rightIcon && (
                <span aria-hidden="true" className="ml-3 inline-flex">
                    {rightIcon}
                </span>
            )}
        </motion.button>
    )
}
