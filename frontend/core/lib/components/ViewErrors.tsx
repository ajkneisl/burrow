import { AnimatePresence, motion } from "framer-motion"

/**
 * {@see ViewErrors}
 */
type ViewErrorsProps = {
    errors: string | string[]
    clearErrors?: () => void
}

/**
 * View one or more errors.
 *
 * @param errors A single error string or array of error strings to display.
 * @param clearErrors Optional callback to clear errors.
 */
export default function ViewErrors({ errors, clearErrors }: ViewErrorsProps) {
    const errorList = Array.isArray(errors) ? errors : [errors]

    if (!errors || errorList.length === 0 || (errorList.length === 1 && !errorList[0])) {
        return null
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    mass: 0.8
                }}
                className="border-error bg-error/5 relative mb-4 rounded-lg border p-4 shadow-sm"
                role="alert"
                aria-live="polite"
            >
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={"text-error h-5 w-5"}
                        >
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </div>

                    <div className="min-w-0 flex-1">
                        <h3 className="text-error mb-2 text-sm font-semibold">
                            {errorList.length === 1
                                ? "There was an error."
                                : `There were ${errorList.length} errors`}
                        </h3>

                        {/* Error List */}
                        <ul className="text-text/90 space-y-1.5 text-sm">
                            {errorList.map((error, index) => (
                                <motion.li
                                    key={index}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{
                                        delay: index * 0.05,
                                        type: "spring",
                                        stiffness: 500,
                                        damping: 30
                                    }}
                                    className="flex items-start gap-2"
                                >
                                    <span
                                        className="text-error mt-0.5 font-bold"
                                        aria-hidden="true"
                                    >
                                        •
                                    </span>
                                    <span className="flex-1">{error}</span>
                                </motion.li>
                            ))}
                        </ul>
                    </div>

                    {clearErrors && (
                        <button
                            onClick={clearErrors}
                            className="text-error/70 hover:bg-error/10 hover:text-error focus:ring-error/30 flex-shrink-0 rounded-lg p-1.5 transition-colors focus:ring-2 focus:outline-none"
                            aria-label="Dismiss errors"
                            title="Dismiss"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-4 w-4"
                            >
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
