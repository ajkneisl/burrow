import { View, Text, TextInput, type TextInputProps } from "react-native"
import clsx from "clsx"

/**
 * {@link Input}
 */
interface InputProps extends TextInputProps {
    label?: string
    error?: string
    helperText?: string
    leftIcon?: React.ReactNode
    rightIcon?: React.ReactNode
    variant?: "default" | "outline" | "filled"
}

/**
 * A themed text input with label, error, and icon support.
 *
 * @param label Optional label displayed above the input.
 * @param error Optional error message displayed below the input.
 * @param helperText Optional helper text displayed below the input.
 * @param leftIcon Optional icon displayed on the left side.
 * @param rightIcon Optional icon displayed on the right side.
 * @param variant The visual style of the input.
 *
 * @author AJ Kneisl
 */
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
    const wrapperStyles = {
        default: "border-b border-card-border",
        outline: "border border-card-border rounded-lg bg-background",
        filled: "bg-card rounded-lg"
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
                    "flex-row items-center overflow-visible",
                    wrapperStyles[variant],
                    error && "border-error"
                )}
            >
                {leftIcon && <View className="pl-4">{leftIcon}</View>}

                <TextInput
                    {...props}
                    className={clsx(
                        "flex-1 items-center text-base text-text min-h-12 py-2 px-4 font-opensans",
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
