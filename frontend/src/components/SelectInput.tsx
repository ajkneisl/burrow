import { type DetailedHTMLProps, type SelectHTMLAttributes } from "react"
import clsx from "clsx"

/**
 * Props for {@link SelectInput}.
 *
 * @param error If there's an error.
 * @param items Array of option labels/values to render.
 * @param text The label text.
 * @param remark Optional remark text below the input.
 */
export type SelectInputProps = {
    error?: boolean
    items: string[]
    text?: string
    remark?: string
} & DetailedHTMLProps<
    SelectHTMLAttributes<HTMLSelectElement>,
    HTMLSelectElement
>

/**
 * A labeled and styled select input.
 */
export default function SelectInput({
    error,
    items,
    text,
    remark,
    ...props
}: SelectInputProps) {
    return (
        <div>
            {text && (
                <label className="block text-sm font-medium mb-1 figree">
                    {text}
                </label>
            )}

            <select
                {...props}
                aria-invalid={error || undefined}
                className={clsx(
                    "border border-neutral-300 bg-hero-50/80 focus:border-secondary focus:bg-hero-50/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/30",
                    "w-full rounded-lg px-3 py-3 text-[15px] shadow-inner transition",
                    error &&
                        "border-red-300 focus:border-red-500 focus:ring-red-300/40",
                    props.disabled && "cursor-not-allowed text-text/60",
                    props.className
                )}
            >
                {items.map((item, idx) => (
                    <option key={`${item}-${idx}`} value={item}>
                        {item}
                    </option>
                ))}
            </select>

            {remark && <p className="mt-2 text-xs text-text/80">{remark}</p>}
        </div>
    )
}
