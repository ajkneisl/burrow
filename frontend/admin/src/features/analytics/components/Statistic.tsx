import { Card } from "@umnburrow/core"
import clsx from "clsx"
import { useMemo } from "react"

export default function Statistic({
    label,
    value,
    accent,
    sublabel
}: {
    label: string
    value: string | number
    accent?: "secondary" | "primary" | "info" | "success" | "warn" | "error"
    sublabel?: string
}) {
    const [textAccent, borderAccent] = useMemo(() => {
        switch (accent) {
            case "primary":
                return ["text-primary", "border-primary/20"]
            case "info":
                return ["text-info", "border-info/20"]
            case "success":
                return ["text-success", "border-success/20"]
            case "warn":
                return ["text-warning", "border-warning/20"]
            case "secondary":
                return ["text-secondary", "border-secondary/20"]
            case "error":
                return ["text-error", "border-error/20"]
        }

        return ["", ""]
    }, [accent])

    return (
        <Card
            className={clsx(
                "flex flex-col gap-1 p-4",
                `border ${borderAccent}`
            )}
        >
            <div className="text-md text-muted-foreground">{label}</div>

            <div
                className={`text-3xl font-semibold tracking-tight ${textAccent}`}
            >
                {value}
            </div>
            {sublabel && (
                <div className="text-xs/5 text-muted-foreground">
                    {sublabel}
                </div>
            )}
        </Card>
    )
}
