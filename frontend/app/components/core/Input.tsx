import { View, TextInput, type TextInputProps } from "react-native"
import { Text } from "@components/core"
import clsx from "clsx"

interface InputProps extends TextInputProps {
    label?: string
    error?: string
    helperText?: string
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
}

export function Input({
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    className,
    ...props
}: InputProps) {
    return (
        <View className="mb-4">
            {label && (
                <Text className="text-sm font-semibold text-text mb-2">
                    {label}
                </Text>
            )}

            <View
                className={clsx(
                    "flex-row items-center bg-card border border-card-border rounded-lg",
                    error && "border-error"
                )}
            >
                {leftIcon && <View className="pl-3">{leftIcon}</View>}

                <TextInput
                    className={clsx(
                        "flex-1 px-4 py-3 text-base text-text",
                        props.editable === false && "opacity-50",
                        className
                    )}
                    placeholderTextColor="#9CA3AF"
                    {...props}
                />

                {rightIcon && <View className="pr-3">{rightIcon}</View>}
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
