import { AnimatePresence, motion } from "framer-motion"
import type { ReactNode } from "react"
import { useAtom } from "jotai"
import { mobileSearchOpenAtom } from "@features/layout/search/search.atom.ts"

export default function MobileSearch({ input }: { input: ReactNode }) {
    const [open] = useAtom(mobileSearchOpenAtom)

    return (
        <AnimatePresence initial={false} mode="wait">
            {open && (
                <motion.div
                    key="mobile-search"
                    initial={{
                        opacity: 0,
                        y: -10
                    }}
                    animate={{
                        opacity: 1,
                        y: 0
                    }}
                    exit={{
                        opacity: 0,
                        y: -10
                    }}
                    transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
                    className="relative min-h-13 px-3 pb-2 lg:hidden"
                    style={{ willChange: "transform, opacity, clip-path" }}
                >
                    <div className="absolute inset-0 rounded-b-2xl bg-primary shadow-md" />

                    <div className="relative z-10 flex h-full items-center justify-center px-3 py-2">
                        {input}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
