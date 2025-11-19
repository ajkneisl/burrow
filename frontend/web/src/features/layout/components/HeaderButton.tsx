import clsx from "clsx"
import { motion } from "framer-motion"
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
} & DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
>

/**
 * A button on the header.
 * @param icon The icon for the button.
 * @param props Button props
 * @see Header
 */
export default function HeaderButton({ icon, ...props }: HeaderButtonProps) {
    const [pressed, setPressed] = useState(false)
    const auth = useToken()

    return (
        <button
            {...props}
            disabled={auth === null}
            className={clsx(
                "border-white/15 bg-white/5 text-white hover:bg-white/10",
                "focus-visible:ring-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
                "inline-flex h-10 w-10 items-center justify-center rounded-full border",
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
            }}
        >
            <motion.span animate={{ scale: pressed ? 0.92 : 1 }}>
                {icon}
            </motion.span>

            {props.children}
        </button>
    )
}
