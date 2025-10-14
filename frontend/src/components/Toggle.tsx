/**
 * {@see Toggle}
 */
type ToggleProps = {
    title: string
    description?: string
    checked: boolean
    onChange: () => void
}

/**
 * A toggle button
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
    return (
        <label className="flex items-center justify-between py-4 cursor-pointer">
            <div>
                <p className="font-medium">{title}</p>
                {description && (
                    <p className="text-sm text-neutral-500">{description}</p>
                )}
            </div>
            <button
                type="button"
                onClick={onChange}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    checked ? "bg-success" : "bg-neutral-300"
                }`}
            >
                <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        checked ? "translate-x-5" : "translate-x-1"
                    }`}
                />
            </button>
        </label>
    )
}
