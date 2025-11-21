import { useRef } from "react"
import { useSwitch } from "react-aria"
import { useToggleState } from "react-stately"
import type { AriaSwitchProps } from "react-aria"
import clsx from "clsx"

/**
 * {@see Toggle}
 */
type ToggleProps = {
    title?: string
    description?: string
    checked: boolean
    onChange: (checked: boolean) => void
    size?: "default" | "small"
    disabled?: boolean
    variant?: "inline" | "standalone"
    className?: string
}

/**
 * A toggle switch with proper accessibility support.
 *
 * @param title The title of the toggle (optional for standalone variant).
 * @param description An optional description of the toggle.
 * @param checked If it's checked.
 * @param onChange When it's invoked, this should change `checked`.
 * @param size The size of the toggle - "default" or "small".
 * @param disabled Whether the toggle is disabled.
 * @param variant "inline" (with label) or "standalone" (just switch).
 * @param className Additional CSS classes.
 *
 * @author AJ Kneisl
 */
export default function Toggle({
    title,
    description,
    checked,
    onChange,
    size = "default",
    disabled = false,
    variant = "inline",
    className
}: ToggleProps) {
    const props: AriaSwitchProps = {
        isSelected: checked,
        onChange,
        isDisabled: disabled,
        "aria-label": title || "Toggle"
    }

    const state = useToggleState(props)
    const ref = useRef<HTMLInputElement>(null)
    const { inputProps } = useSwitch(props, state, ref)

    const sizes = {
        default: {
            track: "h-6 w-11",
            thumb: "h-5 w-5",
            thumbTranslate: checked ? "translate-x-5" : "translate-x-1"
        },
        small: {
            track: "h-5 w-9",
            thumb: "h-4 w-4",
            thumbTranslate: checked ? "translate-x-4" : "translate-x-0.5"
        }
    }

    const currentSize = sizes[size]

    const switchElement = (
        <div className="relative">
            <input {...inputProps} ref={ref} className="sr-only" />
            <div
                className={clsx(
                    "relative inline-flex items-center rounded-full transition-colors duration-200",
                    currentSize.track,
                    checked
                        ? "bg-green-500"
                        : "bg-neutral-300 dark:bg-neutral-600",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
            >
                <span
                    className={clsx(
                        "inline-block transform rounded-full bg-white shadow-sm transition-transform duration-200",
                        currentSize.thumb,
                        currentSize.thumbTranslate
                    )}
                />
            </div>
        </div>
    )

    if (variant === "standalone") {
        return switchElement
    }

    return (
        <label
            className={clsx(
                "flex cursor-pointer items-center justify-between gap-4 py-4",
                disabled && "cursor-not-allowed",
                className
            )}
        >
            {(title || description) && (
                <div>
                    {title && <p className="font-medium">{title}</p>}
                    {description && (
                        <p className="text-sm text-neutral-500">{description}</p>
                    )}
                </div>
            )}
            {switchElement}
        </label>
    )
}
