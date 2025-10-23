import type { ButtonHTMLAttributes, DetailedHTMLProps } from "react"
import clsx from "clsx"

/**
 * A button on a meeting.
 *
 * @param props Default button props.
 * @constructor
 */
export default function MeetingButton(
    props: DetailedHTMLProps<
        ButtonHTMLAttributes<HTMLButtonElement>,
        HTMLButtonElement
    >
) {
    return (
        <button
            {...props}
            type="button"
            className={clsx(
                "bg-background hover:bg-background/40",
                "border border-transparent",
                "inline-flex items-center justify-center",
                "cursor-pointer rounded-xl p-2 text-sm font-medium shadow-sm transition hover:shadow-md",
                props.className ?? "text-text"
            )}
        >
            {props.children}
        </button>
    )
}
