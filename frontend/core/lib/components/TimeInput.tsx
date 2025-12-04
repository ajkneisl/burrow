import { TimeField, DateInput, DateSegment } from "react-aria-components"
import type { TimeValue } from "react-aria-components"
import clsx from "clsx"

/**
 * {@link TimeInput}
 */
type TimeInputProps = {
    text?: string
    value?: TimeValue | null
    onChange?: (value: TimeValue | null) => void
    error?: boolean
    remark?: string
    disabled?: boolean
    readOnly?: boolean
}

/**
 * A time input with proper keyboard navigation using React Aria.
 * Allows tabbing between hours, minutes, and AM/PM.
 *
 * @param text The label text
 * @param value The time value
 * @param onChange Called when the time changes
 * @param error If there's an error with the input
 * @param remark An optional remark below the input
 * @param disabled Whether the input is disabled
 * @param readOnly Whether the input is read-only
 *
 * @author AJ Kneisl
 */
export default function TimeInput({
    text,
    value,
    onChange,
    error,
    remark,
    disabled,
    readOnly
}: TimeInputProps) {
    return (
        <div className="w-full">
            {text && (
                <label
                    htmlFor="time-input"
                    className="mb-1 block text-sm font-medium figree"
                >
                    {text}
                </label>
            )}

            <TimeField
                value={value}
                onChange={onChange}
                isDisabled={disabled}
                isReadOnly={readOnly}
            >
                <DateInput
                    className={clsx(
                        "relative flex items-center rounded-lg border border-neutral-300 bg-hero-50/80 shadow-inner transition",
                        "focus-within:border-secondary focus-within:bg-hero-50/60 focus-within:ring-2 focus-within:ring-emerald-500/30",
                        error &&
                            "border-red-300 focus-within:border-red-500 focus-within:ring-red-300/40",
                        (readOnly || disabled) && "cursor-not-allowed opacity-60",
                        "w-full py-3 px-3"
                    )}
                >
                    {(segment) => (
                        <DateSegment
                            segment={segment}
                            className={clsx(
                                "rounded px-0.5 tabular-nums outline-none",
                                "focus:bg-secondary focus:text-white",
                                "text-[15px]",
                                segment.isPlaceholder && "text-text/40",
                                (readOnly || disabled) &&
                                    "cursor-not-allowed text-text/60"
                            )}
                        />
                    )}
                </DateInput>
            </TimeField>

            {remark && <p className="mt-1 text-xs text-text/60">{remark}</p>}
        </div>
    )
}
