import { type ReactNode, type RefObject, useEffect, useRef } from "react"
import { AnimatePresence, motion, type Variants } from "framer-motion"
import clsx from "clsx"

/**
 * {@link Dropdown}
 */
type DropdownProps = {
    children?: ReactNode | undefined
    align?: "start" | "end"
    className?: string
    btnRef: RefObject<HTMLButtonElement | null>
    onClose?: () => void
    open: boolean
}

/**
 * A dropdown menu.
 *
 * @param align Where on the page the dropdown should appear.
 * @param className Any additional styling.
 * @param btnRef The ref to the button that opens and closes the dropdown.
 *               This is to exclude it from "clicking on the outside" calculations.
 * @param onClose Close the dropdown. This should modify `open`
 * @param open If the dropdown is open.
 * @param children The contents of a dropdown, {@link DropdownItem}.
 */
export default function Dropdown({
    align = "end",
    className = "",
    btnRef,
    onClose,
    open,
    children
}: DropdownProps) {
    const menuRef = useRef<HTMLDivElement | null>(null)

    // outside click / escape
    useEffect(() => {
        function onDocClick(e: MouseEvent) {
            if (!open) return
            const target = e.target as Node
            if (
                menuRef.current?.contains(target) ||
                btnRef.current?.contains(target)
            )
                return
            onClose?.()
        }

        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose?.()
        }

        document.addEventListener("mousedown", onDocClick)
        document.addEventListener("keydown", onKey)

        return () => {
            document.removeEventListener("mousedown", onDocClick)
            document.removeEventListener("keydown", onKey)
        }
    }, [open, onClose, btnRef])

    // focus first item when opening
    useEffect(() => {
        if (open) {
            const first =
                menuRef.current?.querySelector<HTMLElement>("[role='menuitem']")
            first?.focus()
        }
    }, [open])

    // animation variants
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

    return (
        <div className="relative inline-block text-left">
            {open && (
                <AnimatePresence>
                    <motion.div
                        ref={menuRef}
                        role="menu"
                        aria-label="Dropdown menu"
                        className={clsx(
                            `absolute z-20 w-56 rounded-xl bg-card border border-card-border p-1.5 shadow-lg ring-1 ring-black/5`,
                            align === "end"
                                ? "origin-top-right right-0"
                                : "origin-top-left left-0",
                            className
                        )}
                        variants={menuVariants}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    )
}

/**
 * {@see DropdownItem}
 */
type DropdownItem = {
    label: string
    onSelect: () => void
    rightIcon?: ReactNode
}

/**
 * A dropdown item.
 *
 * @param label The label for the item.
 * @param onSelect When the item is clicked.
 * @param rightIcon The icon to the right of the label
 *
 * @author AJ Kneisl
 */
export function DropdownItem({ label, onSelect, rightIcon }: DropdownItem) {
    const itemVariants: Variants = {
        hidden: { opacity: 0, y: -4 },
        show: {
            opacity: 1,
            y: 0,
            transition: { type: "spring", stiffness: 500, damping: 30 }
        },
        exit: { opacity: 0, y: -4 }
    }

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
