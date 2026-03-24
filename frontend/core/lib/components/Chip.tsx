import { type ComponentType, type SVGProps } from "react"

type ChipProps = {
    size: "sm" | "md" | "lg"
    color?: "error" | "warning" | "info" | "success" | "primary" | "secondary"
    icon?: ComponentType<SVGProps<SVGSVGElement>>
    className?: string
    children?: React.ReactNode | string
}

const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm"
}

export default function Chip({
    size,
    color,
    icon: Icon,
    className,
    children
}: ChipProps) {
    return (
        <span
            className={`bg-${color ?? "hero "}/20 text-${color ?? "text"} inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]} ${className ?? ""}`}
        >
            {Icon && <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />}

            <span className="max-w-[16ch] truncate">{children}</span>
        </span>
    )
}
