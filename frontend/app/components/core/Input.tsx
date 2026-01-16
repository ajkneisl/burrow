import { View, Text, TextInput, type TextInputProps } from "react-native"
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
    const variantStyles = {
        default: "border-b border-gray-300 dark:border-gray-600",
        outline:
            "border border-gray-300 dark:border-gray-600 rounded-lg bg-background",
        filled: "bg-card dark:bg-card rounded-lg"
    }

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
                        "flex-1 text-base text-text py-3 px-4",
                        variantStyles[variant],
                        error && "border-error",
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
