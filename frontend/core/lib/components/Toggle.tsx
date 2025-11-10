import { useRef } from "react"
import { useSwitch } from "react-aria"
import { useToggleState } from "react-stately"
import type { AriaSwitchProps } from "react-aria"

/**
 * {@see Toggle}
 */
type ToggleProps = {
    title: string
    description?: string
    checked: boolean
    onChange: (checked: boolean) => void
}

/**
 * A toggle switch with proper accessibility support.
 *
 * @param title The title of the toggle.
 * @param description An optional description of the toggle.
 * @param checked If it's checked.
 * @param onChange When it's invoked, this should change `checked`.
 */
export default function Toggle({
    title,
    description,
    checked,
    onChange
}: ToggleProps) {
    const props: AriaSwitchProps = {
        isSelected: checked,
        onChange,
        "aria-label": title
    }

    const state = useToggleState(props)
    const ref = useRef<HTMLInputElement>(null)
    const { inputProps } = useSwitch(props, state, ref)

    return (
        <label className="flex items-center justify-between gap-4 py-4 cursor-pointer">
            <div>
                <p className="font-medium">{title}</p>
                {description && (
                    <p className="text-sm text-neutral-500">{description}</p>
                )}
            </div>
            <div className="relative">
                <input
                    {...inputProps}
                    ref={ref}
                    className="sr-only"
                />
                <div
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-within:ring-2 focus-within:ring-success focus-within:ring-offset-2 ${
                        checked ? "bg-success" : "bg-neutral-300"
                    }`}
                >
                    <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                            checked ? "translate-x-5" : "translate-x-1"
                        }`}
                    />
                </div>
            </div>
        </label>
    )
}
