import React, { useState } from "react"
import { Pressable, ActivityIndicator, Text as RNText } from "react-native"
import type { PressableProps } from "react-native"
import clsx from "clsx"
import { useThemeColors } from "@api/theme/useThemeColors"

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

const SIZE_STYLES = {
    sm: { container: "px-3 py-2", fontSize: 14 },
    md: { container: "px-4 py-3", fontSize: 16 },
    lg: { container: "px-6 py-4", fontSize: 18 }
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
    const colors = useThemeColors()
    const [pressed, setPressed] = useState(false)
    const isDisabled = disabled || loading
    const s = SIZE_STYLES[size]

    const bgColors: Record<ButtonVariant, string> = {
        primary: colors.primary,
        secondary: colors.secondary,
        danger: colors.error,
        success: colors.success,
        outline: "transparent",
        ghost: "transparent"
    }

    const textColors: Record<ButtonVariant, string> = {
        primary: "#FFFFFF",
        secondary: "#111827",
        danger: "#FFFFFF",
        success: "#FFFFFF",
        outline: colors.primary,
        ghost: colors.primary
    }

    const textColor = textColors[variant]

    return (
        <Pressable
            {...props}
            disabled={isDisabled}
            onPressIn={(e) => {
                setPressed(true)
                props.onPressIn?.(e)
            }}
            onPressOut={(e) => {
                setPressed(false)
                props.onPressOut?.(e)
            }}
            className={clsx(
                "rounded-xl",
                s.container,
                fullWidth && "w-full",
                className
            )}
            style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                backgroundColor: bgColors[variant],
                opacity: isDisabled ? 0.5 : pressed ? 0.7 : 1,
                ...(variant === "outline" && {
                    borderWidth: 2,
                    borderColor: colors.primary
                })
            }}
        >
            {loading ? (
                <ActivityIndicator color={textColor} size="small" />
            ) : (
                <>
                    {leftIcon}

                    <RNText
                        style={{
                            fontFamily: "Inter-SemiBold",
                            fontSize: s.fontSize,
                            color: textColor,
                            includeFontPadding: false
                        }}
                    >
                        {children}
                    </RNText>

                    {rightIcon}
                </>
            )}
        </Pressable>
    )
}
