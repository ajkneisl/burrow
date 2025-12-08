import React from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
    Modal as AriaModal,
    ModalOverlay,
    Dialog,
    Heading,
    Button
} from "react-aria-components"

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
 * A reusable modal element with react-aria for accessibility.
 *
 * @param open If the modal is open.
 * @param onClose When the modal is closed. This should modify `open`.
 * @param title The title of the modal. This can be empty.
 * @param children The contents of the modal.
 * @param footer The footer of the modal. This can be empty.
 * @param widthClass The class that defines the width, by default `max-w-lg`
 *
 * @author AJ Kneisl
 */
export default function Modal({
    open,
    onClose,
    title,
    children,
    footer,
    widthClass = "max-w-lg"
}: ModalProps) {
    return (
        <AnimatePresence>
            {open && (
                <ModalOverlay
                    isOpen={open}
                    onOpenChange={(isOpen) => !isOpen && onClose()}
                    isDismissable
                    className="fixed inset-0 z-50 overflow-y-auto"
                >
                    <motion.div
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    />

                    <div className="absolute inset-0 grid place-items-center p-4">
                        <AriaModal className="outline-none">
                            <Dialog className="outline-none">
                                {({ close }) => (
                                    <motion.div
                                        className={`text-text w-full ${widthClass} rounded-2xl border border-background/80 bg-background shadow-xl ring-1 ring-black/5 backdrop-blur`}
                                        initial={{
                                            opacity: 0,
                                            scale: 0.96,
                                            y: 10
                                        }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{
                                            opacity: 0,
                                            scale: 0.98,
                                            y: 6
                                        }}
                                        transition={{
                                            type: "spring",
                                            stiffness: 380,
                                            damping: 28
                                        }}
                                    >
                                        {title && (
                                            <header className="flex items-center justify-between gap-4 border-b px-6 py-5">
                                                <Heading
                                                    slot="title"
                                                    className="text-xl font-semibold tracking-tight"
                                                >
                                                    {title}
                                                </Heading>

                                                <Button
                                                    onPress={close}
                                                    className="text-text/60 hover:text-text hover:bg-text/10 focus-visible:ring-primary -mr-2 grid h-9 w-9 cursor-pointer place-items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                                    aria-label="Close modal"
                                                >
                                                    <svg
                                                        viewBox="0 0 24 24"
                                                        className="h-5 w-5"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth={2.5}
                                                        strokeLinecap="round"
                                                    >
                                                        <path d="M6 6l12 12M18 6 6 18" />
                                                    </svg>
                                                </Button>
                                            </header>
                                        )}

                                        <div className="px-6 py-6">
                                            {children}
                                        </div>

                                        {footer && (
                                            <footer className="flex items-center justify-end gap-3 rounded-b-2xl border-t px-6 py-4">
                                                {footer}
                                            </footer>
                                        )}
                                    </motion.div>
                                )}
                            </Dialog>
                        </AriaModal>
                    </div>
                </ModalOverlay>
            )}
        </AnimatePresence>
    )
}
