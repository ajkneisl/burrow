import React from "react"
import { View } from "react-native"
import type { ViewProps } from "react-native"
import { GlassSurface, glassAvailable } from "@components/core/GlassSurface"
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
    // border/shadow variants only matter on the solid fallback — glass
    // provides its own depth and edge treatment
    const variantStyles = {
        default: "",
        bordered: "border border-card-border",
        elevated: "shadow-lg"
    }

    return (
        <GlassSurface
            {...props}
            className={clsx(
                "rounded-2xl p-4",
                !glassAvailable && variantStyles[variant],
                className
            )}
            fallbackClassName="bg-card"
        >
            {children}
        </GlassSurface>
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
