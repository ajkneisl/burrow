import type { DetailedHTMLProps, HTMLAttributes, ReactNode } from "react"
import clsx from "clsx"

/**
 * Props for {@link Card}.
 *
 * @param title The title of the card.
 */
type CardProps = {
    title?: string
    top?: ReactNode
} & DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>

/**
 * A card.
 *
 * @param props {@link CardProps}
 */
export default function Card(props: CardProps) {
    return (
        <section
            {...props}
            className={clsx(
                "border border-primary/30 rounded-2xl bg-card/80 p-4 shadow-sm",
                props.className
            )}
        >
            {props.top ? (
                props.top
            ) : (
                <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">{props.title}</h3>
                </div>
            )}

            {props.children}
        </section>
    )
}
