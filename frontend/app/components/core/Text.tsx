import { Text as RNText, type TextProps } from "react-native"

/**
 * Drop-in replacement for React Native's {@link RNText} that defaults
 * to Inter-Regular. Use `font-medium`, `font-semibold`, `font-bold`,
 * or `font-extrabold` classes to switch weights.
 */
export function Text({ style, ...props }: TextProps) {
    return (
        <RNText
            {...props}
            style={[{ fontFamily: "Inter-Medium" }, style]}
        />
    )
}
