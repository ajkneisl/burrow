import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect"
import type { GlassViewProps } from "expo-glass-effect"
import { cssInterop } from "nativewind"
import { View } from "react-native"
import type { ViewProps } from "react-native"
import clsx from "clsx"

/** Whether Liquid Glass can render on this device (iOS 26+). */
export const glassAvailable = isLiquidGlassAvailable()

// let NativeWind resolve className onto GlassView's style prop
cssInterop(GlassView, { className: "style" })

/**
 * {@link GlassSurface}
 */
interface GlassSurfaceProps extends ViewProps {
    /** Glass effect style — "regular" adapts to content, "clear" is more transparent. */
    glassEffectStyle?: GlassViewProps["glassEffectStyle"]
    /** Tint color applied to the glass effect. */
    tintColor?: string
    /** Whether the glass reacts to touches (buttons, etc.). */
    isInteractive?: boolean
    /** Classes applied only when glass is unavailable (the solid fallback). */
    fallbackClassName?: string
}

/**
 * A surface that renders Apple Liquid Glass on iOS 26+ and falls back to a
 * plain themed View elsewhere (Android, older iOS).
 *
 * Background classes belong in `fallbackClassName` — a solid background on
 * the glass view would paint over the effect.
 *
 * @author AJ Kneisl
 */
export function GlassSurface({
    glassEffectStyle = "regular",
    tintColor,
    isInteractive,
    fallbackClassName,
    className,
    children,
    ...props
}: GlassSurfaceProps) {
    if (glassAvailable) {
        return (
            <GlassView
                glassEffectStyle={glassEffectStyle}
                tintColor={tintColor}
                isInteractive={isInteractive}
                className={className}
                {...props}
            >
                {children}
            </GlassView>
        )
    }

    return (
        <View className={clsx(className, fallbackClassName)} {...props}>
            {children}
        </View>
    )
}
