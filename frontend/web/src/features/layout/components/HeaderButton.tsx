import clsx from "clsx"
import { AnimatePresence, motion } from "framer-motion"
import {
    useState,
    type ButtonHTMLAttributes,
    type DetailedHTMLProps,
    type ReactNode
} from "react"
import useToken from "@features/auth/hooks/useToken.ts"

/**
 * {@see HeaderButton}
 */
type HeaderButtonProps = {
    icon: ReactNode
    description?: string
} & DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
>

/**
 * A button on the header.
 * @param icon The icon for the button.
 * @param description Optional tooltip text shown on hover.
 * @param props Button props
 * @see Header
 */
export default function HeaderButton({
    icon,
    description,
    ...props
}: HeaderButtonProps) {
    const [pressed, setPressed] = useState(false)
    const [hovered, setHovered] = useState(false)
    const auth = useToken()

    return (
        <div className="relative inline-block">
            <button
                {...props}
                disabled={auth === null}
                className={clsx(
                    "border-white/15 bg-white/5 text-white hover:bg-white/10",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                    "inline-flex size-10 items-center justify-center rounded-full border",
                    auth === null ? "cursor-not-allowed" : "cursor-pointer",
                    props.className
                )}
                onPointerDown={(e) => {
                    props.onPointerDown?.(e)
                    setPressed(true)
                }}
                onPointerUp={(e) => {
                    props.onPointerUp?.(e)
                    setPressed(false)
                }}
                onPointerLeave={(e) => {
                    props.onPointerLeave?.(e)
                    setPressed(false)
                    setHovered(false)
                }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                <motion.span animate={{ scale: pressed ? 0.92 : 1 }}>
                    {icon}
                </motion.span>

                {props.children}
            </button>

            <AnimatePresence>
                {description && hovered && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="pointer-events-none absolute top-full left-1/2 z-50 mt-2 -translate-x-1/2 rounded-md bg-black/90 px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-white shadow-lg"
                    >
                        {description}
                        <div className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-black/90" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
