import {
    type ButtonHTMLAttributes,
    type DetailedHTMLProps,
    useMemo
} from "react"
import clsx from "clsx"

/**
 * Props for {@link Button}
 *
 * @param colors Custom colors / borders.
 * @param color A pre-made color
 */
type ButtonProps = {
    colors?: string
    color?: "ERROR" | "WARNING" | "INFO" | "SUCCESS" | "PRIMARY" | "SECONDARY"
} & DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
>

/**
 * A stylized button.
 *
 * @param props {@link ButtonProps}
 */
export default function Button(props: ButtonProps) {
    const colorStyles = useMemo(() => {
        switch (props.color) {
            case "ERROR":
                return "border border-error bg-error/80"
            case "WARNING":
                break
            case "INFO":
                return "border border-info bg-info/80"
            case "SUCCESS":
                return "border border-success bg-success/80"
            case "PRIMARY":
                return "border border-primary bg-primary/60"
            case "SECONDARY":
                return "border border-secondary bg-secondary/80"
        }
    }, [props.color])

    return (
        <button
            {...props}
            onClick={props.onClick}
            className={clsx(
                "cursor-pointer inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium shadow-sm transition hover:shadow-md",
                props.colors,
                colorStyles
            )}
        >
            {props.children}
        </button>
    )
}
