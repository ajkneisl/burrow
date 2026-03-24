import { Text as RNText, type TextProps, type TextStyle } from "react-native"

const FONT_MAP: Record<string, string> = {
    sans: "Inter-Regular",
    medium: "Inter-Medium",
    semibold: "Inter-SemiBold",
    bold: "Inter-Bold",
    extrabold: "Inter-ExtraBold",
    figtree: "Figtree-ExtraBold"
}

const FONT_CLASS_RE = /\bfont-(sans|medium|semibold|bold|extrabold|figtree)\b/

/**
 * Drop-in replacement for React Native's {@link RNText} that defaults
 * to Inter-Medium. Any font-* className will select the correct font.
 */
export function Text({
    style,
    className,
    ...props
}: TextProps & { className?: string }) {
    const match = className?.match(FONT_CLASS_RE)
    const fontFamily = match ? FONT_MAP[match[1]] : "Inter-Medium"

    return (
        <RNText
            {...props}
            className={className}
            style={[style, { fontFamily } as TextStyle]}
        />
    )
}
