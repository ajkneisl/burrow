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
        const make = (
            baseVar: string,
            hoverVar?: string,
            opts?: { textOnGold?: boolean }
        ) =>
            clsx(
                `border border-${baseVar} bg-${baseVar}/80`,
                hoverVar && `hover:bg-${hoverVar}`,
                opts?.textOnGold ? "text-black" : "text-white",
                `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-${baseVar}`
            )

        switch (color) {
            case "ERROR":
                return make("error", "error-hover")

            case "WARNING":
                // Use Minnesota gold; ensure readable dark text on gold
                return make("warn", "warn-hover-color", {
                    textOnGold: true
                })
            case "INFO":
                return make("info", "info-hover")
            case "SUCCESS":
                return make("success", "success-hover")
            case "PRIMARY":
                // PRIMARY = Maroon
                return make("primary", "secondary-hover")
            case "SECONDARY":
                // SECONDARY = Gold; readable dark text
                return make("secondary", "primary-hover", {
                    textOnGold: true
                })
            default:
                // Neutral fallback using card/text variables
                return clsx(
                    "border border-transparent",
                    "bg-card text-text",
                    "hover:bg-hero",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
                )
        }
    }, [color])

    const basePadding = thin ? "py-1" : "py-2"

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
                basePadding,
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
