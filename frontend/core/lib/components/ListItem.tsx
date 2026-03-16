import type { ReactNode } from "react"
import clsx from "clsx"

/**
 * {@link ListItem}
 */
type ListItemProps = {
    onClick?: () => void
    leading?: ReactNode
    title: string
    subtitle?: ReactNode
    trailing?: ReactNode
    className?: string
}

/**
 * A clickable list item row with optional leading/trailing slots.
 *
 * @param onClick Click handler.
 * @param leading Left-side content (e.g. avatar, icon).
 * @param title Primary text.
 * @param subtitle Secondary content below the title.
 * @param trailing Right-side content (e.g. badge, action).
 * @param className Additional class names.
 */
export default function ListItem({
    onClick,
    leading,
    title,
    subtitle,
    trailing,
    className
}: ListItemProps) {
    return (
        <li
            onClick={onClick}
            className={clsx(
                "flex items-center gap-3 rounded-lg bg-hero/80 px-4 py-3 transition-colors",
                onClick && "cursor-pointer hover:bg-hero/50",
                className
            )}
        >
            {leading}

            <div className="min-w-0 flex-1">
                <p className="text-text truncate text-base font-medium">
                    {title}
                </p>
                {subtitle && <div>{subtitle}</div>}
            </div>

            {trailing}
        </li>
    )
}