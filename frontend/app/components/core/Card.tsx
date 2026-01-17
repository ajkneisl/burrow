import React from "react"
import { View } from "react-native"
import type { ViewProps } from "react-native"
import clsx from "clsx"

interface CardProps extends ViewProps {
    children: React.ReactNode
    variant?: "default" | "bordered" | "elevated"
}

export function Card({
    children,
    variant = "default",
    className,
    ...props
}: CardProps) {
    const baseStyles = "bg-card rounded-2xl"

    const variantStyles = {
        default: "p-4",
        bordered: "p-4 border border-card-border",
        elevated: "p-4 shadow-lg"
    }

    return (
        <View
            {...props}
            className={clsx(baseStyles, variantStyles[variant], className)}
        >
            {children}
        </View>
    )
}

interface CardHeaderProps extends ViewProps {
    children: React.ReactNode
}

export function CardHeader({ children, className, ...props }: CardHeaderProps) {
    return (
        <View {...props} className={clsx("mb-3", className)}>
            {children}
        </View>
    )
}

interface CardBodyProps extends ViewProps {
    children: React.ReactNode
}

export function CardBody({ children, className, ...props }: CardBodyProps) {
    return (
        <View {...props} className={clsx("flex-1", className)}>
            {children}
        </View>
    )
}

interface CardFooterProps extends ViewProps {
    children: React.ReactNode
}

export function CardFooter({ children, className, ...props }: CardFooterProps) {
    return (
        <View
            {...props}
            className={clsx("mt-3 flex-row justify-end gap-2", className)}
        >
            {children}
        </View>
    )
}
