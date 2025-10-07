import { AnimatePresence, motion } from "framer-motion"
import type { ReactNode } from "react"

export default function MobileSearch({
    mobileSearchOpen,
    input
}: {
    input: ReactNode
    mobileSearchOpen: boolean
}) {
    return (
        <AnimatePresence initial={false}>
            {mobileSearchOpen && (
                <motion.div
                    key="mobile-search"
                    initial={{ opacity: 0, height: 0, y: -6 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -6 }}
                    transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 36,
                        mass: 0.3
                    }}
                    className="px-4 pb-3 lg:hidden"
                >
                    {input}
                </motion.div>
            )}
        </AnimatePresence>
    )
}
