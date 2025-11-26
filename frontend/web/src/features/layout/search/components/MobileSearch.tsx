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
                    className=" px-3 pb-2 lg:hidden min-h-[3.25rem] -mt-1"
                    style={{ willChange: "transform, opacity, clip-path" }}
                >
                    <div className="absolute inset-0 rounded-b-2xl rounded-none bg-primary shadow-md" />

                    <div className="h-full flex items-center justify-center z-10 px-3 py-2">
                        {input}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
