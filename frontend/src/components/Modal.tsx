import React, { useId } from "react"
import { AnimatePresence, motion } from "framer-motion"

/**
 * {@see Modal}
 */
type ModalProps = {
    open: boolean
    onClose: () => void
    title?: string
    children: React.ReactNode
    footer?: React.ReactNode
    widthClass?: string
}

/**
 * A reusable modal element.
 *
 * @param open If the modal is open.
 * @param onClose When the modal is closed. This should modify `open`.
 * @param title The title of the modal. This can be empty.
 * @param children The contents of the modal.
 * @param footer The footer of the modal. This can be empty.
 * @param widthClass The class that defines the width, by default `max-w-lg`
 */
export default function Modal({
    open,
    onClose,
    title,
    children,
    footer,
    widthClass = "max-w-lg"
}: ModalProps) {
    const id = useId()
    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 overflow-y-scroll">
                    <motion.div
                        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        aria-hidden
                    />

                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={title ? `${id}-title` : undefined}
                        className="absolute inset-0 grid place-items-center p-4"
                        initial={{ opacity: 0, scale: 0.96, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: 6 }}
                        transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 28
                        }}
                    >
                        <div
                            className={`text-text w-full ${widthClass} rounded-2xl border border-background/80 bg-background shadow-xl ring-1 ring-black/5 backdrop-blur`}
                        >
                            {title && (
                                <header className="flex items-center justify-between gap-4 px-6 py-5 border-b">
                                    {title ? (
                                        <h2
                                            id={`${id}-title`}
                                            className="text-xl font-semibold tracking-tight"
                                        >
                                            {title}
                                        </h2>
                                    ) : (
                                        <span />
                                    )}

                                    <button
                                        className="grid cursor-pointer place-items-center h-9 w-9 rounded-full hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40"
                                        onClick={onClose}
                                        aria-label="Close"
                                    >
                                        <svg
                                            viewBox="0 0 24 24"
                                            className="w-5 h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth={2}
                                        >
                                            <path d="M6 6l12 12M18 6 6 18" />
                                        </svg>
                                    </button>
                                </header>
                            )}

                            <div className="px-6 py-6">{children}</div>

                            {footer && (
                                <footer className="flex items-center justify-end gap-3 px-6 py-4 border-t rounded-b-2xl">
                                    {footer}
                                </footer>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
