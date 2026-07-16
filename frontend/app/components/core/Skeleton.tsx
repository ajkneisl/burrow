import { useEffect } from "react"
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming
} from "react-native-reanimated"

type SkeletonProps = {
    className?: string
}

/**
 * A pulsing placeholder block, used to build skeleton loaders for content
 * that hasn't finished loading yet.
 *
 * @param className Sizing/shape classes (e.g. `"h-4 w-24 rounded-full"`).
 *
 * @author AJ Kneisl
 */
export function Skeleton({ className = "" }: SkeletonProps) {
    const opacity = useSharedValue(0.4)

    useEffect(() => {
        opacity.value = withRepeat(
            withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        )
    }, [opacity])

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value
    }))

    return (
        <Animated.View
            className={`bg-card-border rounded-md ${className}`}
            style={animatedStyle}
        />
    )
}
