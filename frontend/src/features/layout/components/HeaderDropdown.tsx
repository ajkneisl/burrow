import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion, type Variants } from "framer-motion"
import { useNavigate } from "react-router"
import { useAtom } from "jotai"
import { authToken } from "@features/auth/api/auth.atom.ts"

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
                        />

                        {/* Log out  */}
                        <MenuItem
                            label="Log out"
                            onSelect={() => {
                                setAuth("")
                                setOpen(false)
                            }}
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
}

/**
 * A menu item in {@link HeaderDropdown}.
 *
 * @param label The label for the menu item.
 * @param onSelect When this button is selected.
 * @constructor
 */
function MenuItem({ label, onSelect }: MenuItemProps) {
    return (
        <motion.button
            role="menuitem"
            onClick={onSelect}
            className="flex w-full cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-text hover:bg-background"
            variants={itemVariants}
            whileTap={{ scale: 0.98 }}
        >
            <span className="truncate">{label}</span>
        </motion.button>
    )
}
