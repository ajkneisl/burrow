import React from "react"

/**
 * An individual field on the modal.
 *
 * @param label The label for the field.
 * @param error If there's an error.
 * @param children The input itself.
 * @param className Additional styling.
 * @constructor
 */
export default function Field({
    label,
    error,
    children,
    className = ""
}: {
    label: string
    error?: string
    children: React.ReactNode
    className?: string
}) {
    return (
        <div className={className}>
            <label className="mb-1 block text-[13px] font-medium tracking-wide text-text/80">
                {label}
            </label>
            {children}
            {error && (
                <p className="mt-1 text-xs font-medium text-red-600">{error}</p>
            )}
        </div>
    )
}
