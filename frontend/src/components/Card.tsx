import type { DetailedHTMLProps, HTMLAttributes } from "react"
import clsx from "clsx"

/**
 * Props for {@link Card}.
 *
 * @param title The title of the card.
 */
type CardProps = {
    title?: string
    isHoverable?: boolean
} & DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>

/**
 * A card.
 *
 * @param title The title of the card.
 * @param isHoverable If there should be a style when this is hovered.
 * @param props {@link CardProps}
 */
export default function Card({ title, isHoverable, ...props }: CardProps) {
    return (
        <section
            {...props}
            className={clsx(
                "card transition-all border border-card-border rounded-2xl bg-card p-5 shadow-sm",
                isHoverable &&
                    "cursor-pointer hover:bg-card/80 hover:shadow-md",
                props.className
            )}
        >
            {title && (
                <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">{title}</h3>
                </div>
            )}

            {props.children}
        </section>
    )
}
