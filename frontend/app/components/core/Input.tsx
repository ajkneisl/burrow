import { useState } from "react"
import { View, TextInput, type TextInputProps } from "react-native"
import { Text } from "@components/core"
import { GlassSurface, glassAvailable } from "@components/core/GlassSurface"
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
    multiline,
    onFocus,
    onBlur,
    ...props
}: InputProps) {
    const [focused, setFocused] = useState(false)

    return (
        <View className="mb-4">
            {label && (
                <Text className="text-sm font-semibold text-text mb-2">
                    {label}
                </Text>
            )}

            <GlassSurface
                className={clsx(
                    "flex-row border rounded-lg",
                    multiline ? "items-start" : "items-center",
                    error
                        ? "border-error"
                        : focused
                          ? "border-primary"
                          : glassAvailable
                            ? "border-transparent"
                            : "border-card-border"
                )}
                fallbackClassName="bg-card"
            >
                {leftIcon && (
                    <View className={clsx("pl-3", multiline && "pt-3")}>
                        {leftIcon}
                    </View>
                )}

                {/* text-[16px] (not text-base) — NativeWind's text-base adds a
                    24px line height, which makes iOS TextInputs shift text
                    downward while typing */}
                <TextInput
                    className={clsx(
                        "flex-1 px-4 text-[16px] text-text",
                        multiline ? "py-3 min-h-[96px]" : "h-12",
                        props.editable === false && "opacity-50",
                        className
                    )}
                    placeholderTextColor="#9CA3AF"
                    multiline={multiline}
                    textAlignVertical={multiline ? "top" : "center"}
                    onFocus={(e) => {
                        setFocused(true)
                        onFocus?.(e)
                    }}
                    onBlur={(e) => {
                        setFocused(false)
                        onBlur?.(e)
                    }}
                    {...props}
                />

                {rightIcon && (
                    <View className={clsx("pr-3", multiline && "pt-3")}>
                        {rightIcon}
                    </View>
                )}
            </GlassSurface>

            {error && <Text className="text-sm text-error mt-1">{error}</Text>}
            {helperText && !error && (
                <Text className="text-sm text-text opacity-60 mt-1">
                    {helperText}
                </Text>
            )}
        </View>
    )
}
