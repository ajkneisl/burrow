import { type DetailedHTMLProps, type TextareaHTMLAttributes } from "react"
import clsx from "clsx"

/**
 * Props for {@link TextArea}.
 *
 * @param text The label text.
 * @param remark Optional remark text below the textarea.
 */
export type TextAreaProps = {
    text?: string
    remark?: string
} & DetailedHTMLProps<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    HTMLTextAreaElement
>

/**
 * A labeled textarea.
 */
export default function TextArea({ text, remark, ...props }: TextAreaProps) {
    return (
        <div>
            {text && (
                <label className="block text-sm font-medium mb-1 figree">
                    {text}
                </label>
            )}
            <textarea
                className={clsx(
                    "border border-neutral-300 bg-hero-50/80 focus:border-secondary focus:bg-hero-50/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30",
                    "input w-full min-h-28 rounded-xl px-3 py-2 text-[15px] shadow-inner transition",
                    props.className
                )}
                {...props}
            />
            {remark && <p className="mt-2 text-xs text-text/80">{remark}</p>}
        </div>
    )
}
