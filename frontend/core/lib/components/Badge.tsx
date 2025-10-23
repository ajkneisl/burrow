import type { ReactNode } from "react"
import clsx from "clsx"

/** Badge chip */
export default function Badge({
    children,
    size
}: {
    children: ReactNode
    size?: "medium" | "large"
}) {
    return (
        <span
            className={clsx(
                "inline-flex items-center rounded-full px-2 py-0.5 font-medium tracking-tight gap-1 rounded-full bg-hero px-3 py-1 text-sm font-medium text-text/80 ring-1 ring-inset ring-primary/15",
                size === "medium" ? "text-xs" : "text-sm"
            )}
        >
            {children}
        </span>
    )
}
