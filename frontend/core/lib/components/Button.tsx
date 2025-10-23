import {
    type ButtonHTMLAttributes,
    type DetailedHTMLProps,
    useMemo
} from "react"
import clsx from "clsx"

/**
 * Props for {@link Button}
 *
 * @param colors  Custom classes to fully override color styling (optional).
 * @param color   A pre-made color token to use.
 * @param thin    Reduces vertical padding when true.
 * @param loading Shows a spinner and disables the button when true.
 */
export type ButtonProps = {
    colors?: string
    color?: "ERROR" | "WARNING" | "INFO" | "SUCCESS" | "PRIMARY" | "SECONDARY"
    thin?: boolean
    loading?: boolean
} & Omit<
    DetailedHTMLProps<
        ButtonHTMLAttributes<HTMLButtonElement>,
        HTMLButtonElement
    >,
    "color"
>

/**
 * A stylized button.
 */
export default function Button({
    colors,
    color,
    thin = false,
    loading = false,
    className,
    children,
    disabled,
    onClick,
    ...rest
}: ButtonProps) {
    const colorStyles = useMemo(() => {
        const make = (classes: string, opts?: { textOnGold?: boolean }) =>
            clsx(
                classes,
                opts?.textOnGold ? "text-black" : "text-white",
                `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`
            )

        switch (color) {
            case "ERROR":
                return make(
                    `focus-visible:ring-error border-error bg-error/80 hover:bg-error-hover`
                )
            case "WARNING":
                return make(
                    `focus-visible:ring-warning border-warning bg-warning/80 hover:bg-warning-hover`
                )
            case "INFO":
                return make(
                    `focus-visible:ring-info border-info bg-info/80 hover:bg-info-hover`
                )
            case "SUCCESS":
                return make(
                    `focus-visible:ring-success border-success bg-success/80 hover:bg-success-hover`
                )
            case "PRIMARY":
                return make(
                    `focus-visible:ring-primary border-primary bg-primary/80 hover:bg-primary-hover`
                )
            case "SECONDARY":
                return make(
                    `focus-visible:ring-secondary border-secondary bg-secondary/80 hover:bg-secondary-hover/70`
                )
            default:
                return clsx(
                    "border border-transparent",
                    "bg-card text-text",
                    "hover:bg-hero",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
                )
        }
    }, [color])

    const isDisabled = disabled || loading

    return (
        <button
            {...rest}
            onClick={onClick}
            disabled={isDisabled}
            aria-disabled={isDisabled}
            aria-busy={loading || undefined}
            className={clsx(
                "cursor-pointer inline-flex select-none items-center justify-center gap-1 rounded-xl px-4",
                thin ? "py-1" : "py-2",
                "text-sm font-medium shadow-sm transition focus-visible:shadow-md",
                "disabled:cursor-not-allowed disabled:opacity-60",
                colors,
                colorStyles,
                className
            )}
        >
            {children}
            {loading && (
                <svg
                    className="ms-2 h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    role="status"
                    aria-label="Loading"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                </svg>
            )}
        </button>
    )
}
