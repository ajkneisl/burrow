import clsx from "clsx"
import type { DetailedHTMLProps, InputHTMLAttributes } from "react"

/**
 * Props for {@link Input}.
 *
 * @param text The text for the label.
 * @param remark An optional remark below the input.
 */
type LabelledInputProps = {
    text?: string
    remark?: string
    error?: boolean
} & DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>

/**
 * A labeled input.
 *
 * @param text
 * @param remark
 * @param error
 * @param props {@link LabelledInputProps}
 */
export default function Input({
    text,
    remark,
    error,
    ...props
}: LabelledInputProps) {
    return (
        <div>
            {text && (
                <label
                    htmlFor="name"
                    className="block text-sm font-medium mb-1 figree"
                >
                    {text}
                </label>
            )}

            <input
                {...props}
                className={clsx(
                    "border border-neutral-300 bg-hero-50/80 focus:border-secondary focus:bg-hero-50/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30",
                    `w-full input rounded-lg px-3 py-3 text-[15px] placeholder:text-text/40 shadow-inner transition`,
                    error &&
                        "border-red-300 focus:border-red-500 focus:ring-red-300/40",
                    (props.readOnly || props.disabled) &&
                        "cursor-not-allowed text-text/60",
                    props.className
                )}
            />

            {remark && <p className="mt-1 text-xs text-text/60">{remark}</p>}
        </div>
    )
}
