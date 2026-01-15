import React from "react"
import { View, Text, TextInput } from "react-native"
import type { TextInputProps } from "react-native"
import clsx from "clsx"

interface InputProps extends TextInputProps {
    label?: string
    error?: string
    helperText?: string
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
    variant?: "default" | "outline" | "filled"
}

export function Input({
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    variant = "outline",
    className,
    ...props
}: InputProps) {
    const baseInputStyles = "flex-1 text-base text-text py-3 px-4"

    const variantStyles = {
        default: "border-b border-card-border",
        outline: "border border-card-border rounded-lg",
        filled: "bg-card rounded-lg"
    }

    const errorStyles = error ? "border-error" : ""

    return (
        <View className="mb-4">
            {label && (
                <Text className="text-sm font-semibold text-text mb-2">
                    {label}
                </Text>
            )}

            <View
                className={clsx(
                    "flex-row items-center",
                    variant === "outline" && "rounded-lg"
                )}
            >
                {leftIcon && <View className="pl-4">{leftIcon}</View>}

                <TextInput
                    {...props}
                    className={clsx(
                        baseInputStyles,
                        variantStyles[variant],
                        errorStyles,
                        className
                    )}
                    placeholderTextColor="#9CA3AF"
                />

                {rightIcon && <View className="pr-4">{rightIcon}</View>}
            </View>

            {error && <Text className="text-sm text-error mt-1">{error}</Text>}
            {helperText && !error && (
                <Text className="text-sm text-text opacity-60 mt-1">
                    {helperText}
                </Text>
            )}
        </View>
    )
}
