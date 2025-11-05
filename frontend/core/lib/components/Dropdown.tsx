import { type ReactNode, type RefObject } from "react"
import { AnimatePresence, motion, type Variants } from "framer-motion"
import clsx from "clsx"
import { Menu as AriaMenu, MenuItem, Popover } from "react-aria-components"

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
 * A dropdown menu with react-aria for accessibility.
 * Handles ESC key and click-outside automatically.
 *
 * @param align Where on the page the dropdown should appear.
 * @param className Any additional styling.
 * @param btnRef The ref to the button that opens and closes the dropdown.
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
        <AnimatePresence>
            {open && (
                <Popover
                    triggerRef={btnRef}
                    isOpen={open}
                    onOpenChange={(isOpen) => !isOpen && onClose?.()}
                    placement={align === "start" ? "bottom start" : "bottom end"}
                    offset={8}
                    shouldCloseOnInteractOutside={(element) => {
                        // Don't close if clicking the trigger button
                        return !btnRef.current?.contains(element)
                    }}
                    className="relative"
                >
                    <AriaMenu
                        autoFocus="first"
                        className="outline-none"
                        onAction={() => onClose?.()}
                    >
                        <motion.div
                            className={clsx(
                                `w-56 rounded-xl border border-card-border bg-card p-1.5 shadow-lg ring-1 ring-black/5`,
                                align === "end"
                                    ? "origin-top-right"
                                    : "origin-top-left",
                                className
                            )}
                            variants={menuVariants}
                            initial="hidden"
                            animate="show"
                            exit="exit"
                        >
                            {children}
                        </motion.div>
                    </AriaMenu>
                </Popover>
            )}
        </AnimatePresence>
    )
}

/**
 * {@see DropdownItem}
 */
type DropdownItemProps = {
    label: string
    onSelect: () => void
    rightIcon?: ReactNode
}

/**
 * A dropdown item with react-aria for accessibility.
 * Handles keyboard navigation and focus management automatically.
 *
 * @param label The label for the item.
 * @param onSelect When the item is clicked.
 * @param rightIcon The icon to the right of the label
 */
export function DropdownItem({
    label,
    onSelect,
    rightIcon
}: DropdownItemProps) {
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
        <MenuItem
            onAction={onSelect}
            className="cursor-pointer select-none outline-none"
        >
            <motion.div
                className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm text-text hover:bg-background focus:bg-background pressed:bg-background"
                variants={itemVariants}
                whileTap={{ scale: 0.98 }}
            >
                <span className="flex-1 truncate">{label}</span>

                {rightIcon && (
                    <span aria-hidden="true" className="ml-3 inline-flex">
                        {rightIcon}
                    </span>
                )}
            </motion.div>
        </MenuItem>
    )
}
