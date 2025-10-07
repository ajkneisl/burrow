import { type DetailedHTMLProps, type TextareaHTMLAttributes } from "react"
import clsx from "clsx"

type TextAreaProps = {} & DetailedHTMLProps<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    HTMLTextAreaElement
>

export default function TextArea(props: TextAreaProps) {
    return (
        <textarea
            className={clsx(
                "border border-neutral-300 bg-hero-50/80 focus:border-secondary focus:bg-hero-50/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30",
                "input w-full min-h-28 rounded-xl px-3 py-2 text-[15px] shadow-inner transition"
            )}
            {...props}
        />
    )
}
