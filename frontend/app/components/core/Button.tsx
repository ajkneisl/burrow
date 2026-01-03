import React from "react"
import { Pressable, Text, ActivityIndicator, View } from "react-native"
import type { PressableProps } from "react-native"
import clsx from "clsx"

type ButtonVariant =
    | "primary"
    | "secondary"
    | "danger"
    | "success"
    | "outline"
    | "ghost"
type ButtonSize = "sm" | "md" | "lg"

interface ButtonProps extends Omit<PressableProps, "children"> {
    variant?: ButtonVariant
    size?: ButtonSize
    loading?: boolean
    disabled?: boolean
    children: React.ReactNode
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
    fullWidth?: boolean
}

export function Button({
    variant = "primary",
    size = "md",
    loading = false,
    disabled = false,
    children,
    leftIcon,
    rightIcon,
    fullWidth = false,
    className,
    ...props
}: ButtonProps) {
    const isDisabled = disabled || loading

    const baseStyles =
        "flex-row items-center justify-center rounded-lg active:opacity-70"

    const sizeStyles = {
        sm: "px-3 py-2",
        md: "px-4 py-3",
        lg: "px-6 py-4"
    }

    const variantStyles = {
        primary: "bg-primary",
        secondary: "bg-secondary",
        danger: "bg-error",
        success: "bg-success",
        outline: "border-2 border-primary bg-transparent",
        ghost: "bg-transparent"
    }

    const textSizeStyles = {
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg"
    }

    const textVariantStyles = {
        primary: "text-white font-semibold",
        secondary: "text-gray-900 font-semibold",
        danger: "text-white font-semibold",
        success: "text-white font-semibold",
        outline: "text-primary font-semibold",
        ghost: "text-primary font-semibold"
    }

    const disabledStyles = "opacity-50"

    return (
        <Pressable
            {...props}
            disabled={isDisabled}
            className={clsx(
                baseStyles,
                sizeStyles[size],
                variantStyles[variant],
                isDisabled && disabledStyles,
                fullWidth && "w-full",
                className
            )}
        >
            {loading ? (
                <ActivityIndicator
                    color={
                        variant === "outline" || variant === "ghost"
                            ? "#7A0019"
                            : "#FFFFFF"
                    }
                    size="small"
                />
            ) : (
                <View className="flex-row items-center gap-2">
                    {leftIcon && <View>{leftIcon}</View>}
                    <Text
                        className={clsx(
                            textSizeStyles[size],
                            textVariantStyles[variant]
                        )}
                    >
                        {children}
                    </Text>
                    {rightIcon && <View>{rightIcon}</View>}
                </View>
            )}
        </Pressable>
    )
}
