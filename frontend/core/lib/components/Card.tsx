import type {DetailedHTMLProps, HTMLAttributes, ReactNode} from "react"
import clsx from "clsx"

/**
 * Props for {@link Card}.
 *
 * @param title The title of the card.
 */
type CardProps = {
    title?: string
    isHoverable?: boolean
    control?: ReactNode
} & DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>

/**
 * A card.
 *
 * @param title The title of the card.
 * @param isHoverable If there should be a style when this is hovered.
 * @param control An optional control to be placed in the top right. Only visible when {@see title} is present.
 * @param props {@link CardProps}
 */
export default function Card({title, isHoverable, control, ...props}: CardProps) {
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
                <div className="flex flex-row justify-between items-center">
                    <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-sm font-semibold">{title}</h3>
                    </div>

                    {control}
                </div>
            )}

            {props.children}
        </section>
    )
}
