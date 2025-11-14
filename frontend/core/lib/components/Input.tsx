import clsx from "clsx"
import type { DetailedHTMLProps, InputHTMLAttributes, ReactNode } from "react"

/**
 * Props for {@link Input}.
 *
 * @param text The text for the label.
 * @param remark An optional remark below the input.
 * @param endAdornment A button or icon to place at the end of the input.
 * @param startAdornment A button or icon to place at the start of the input.
 */
type LabelledInputProps = {
    text?: string
    remark?: string
    error?: boolean
    endAdornment?: ReactNode
    startAdornment?: ReactNode
} & DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>

/**
 * A labeled input.
 *
 * @param text
 * @param remark
 * @param error
 * @param endAdornment
 * @param startAdornment
 * @param props {@link LabelledInputProps}
 */
export default function Input({
    text,
    remark,
    error,
    endAdornment,
    startAdornment,
    ...props
}: LabelledInputProps) {
    return (
        <div className="w-full">
            {text && (
                <label
                    htmlFor="name"
                    className="mb-1 block text-sm font-medium figree"
                >
                    {text}
                </label>
            )}

            <div
                className={clsx(
                    "relative flex items-center rounded-lg border border-neutral-300 bg-hero-50/80 shadow-inner transition",
                    "focus-within:border-secondary focus-within:bg-hero-50/60 focus-within:ring-2 focus-within:ring-emerald-500/30",
                    error &&
                        "border-red-300 focus-within:border-red-500 focus-within:ring-red-300/40",
                    (props.readOnly || props.disabled) &&
                        "cursor-not-allowed opacity-60"
                )}
            >
                {startAdornment && (
                    <div className="pl-3 flex items-center">
                        {startAdornment}
                    </div>
                )}

                <input
                    {...props}
                    className={clsx(
                        "w-full bg-transparent py-3 text-[15px] placeholder:text-text/40 outline-none",
                        startAdornment ? "pl-2" : "pl-3",
                        endAdornment ? "pr-2" : "pr-3",
                        (props.readOnly || props.disabled) &&
                            "cursor-not-allowed text-text/60",
                        props.className
                    )}
                />

                {endAdornment && (
                    <div className="pr-3 flex items-center">{endAdornment}</div>
                )}
            </div>

            {remark && <p className="mt-1 text-xs text-text/60">{remark}</p>}
        </div>
    )
}
