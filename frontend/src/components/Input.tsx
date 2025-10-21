import { type DetailedHTMLProps, type InputHTMLAttributes } from "react"
import clsx from "clsx"

/**
 * Props for {@link Props}.
 *
 * @param error If there's an error.
 */
export type InputProps = {
    error?: boolean
} & DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>

/**
 * A styled input.
 *
 * @param error
 * @param props {@link InputProps}
 */
export default function Input({ error, ...props }: InputProps) {
    return (
        <input
            {...props}
            className={clsx(
                "border border-neutral-300 bg-hero-50/80 focus:border-secondary focus:bg-hero-50/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30",
                `w-full input rounded-lg px-3 py-3 text-[15px] placeholder:text-text/40 shadow-inner transition`,
                error &&
                    "border-red-300 focus:border-red-500 focus:ring-red-300/40",
                (props.readOnly || props.disabled) && "cursor-not-allowed text-text/60",
                props.className
            )}
        />
    )
}
