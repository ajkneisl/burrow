import type { ReactNode } from "react"
import clsx from "clsx"

/**
 * Badge chip
 *
 * @author AJ Kneisl
 */
export default function Badge({
    children,
    size,
    highlighted
}: {
    children: ReactNode
    size?: "medium" | "large"
    highlighted?: boolean
}) {
    return (
        <span
            className={clsx(
                "inline-flex items-center px-2 py-0.5 font-medium tracking-tight gap-1 rounded-full bg-hero px-3 py-1 text-sm font-medium text-text/80 ring-1 ring-inset ring-primary/15",
                size === "medium" ? "text-xs" : "text-sm",
                highlighted ? "bg-success/30" : "bg-hero"
            )}
        >
            {children}
        </span>
    )
}
