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
 * build skeleton for things that have not loaded yet. placeholder.
 *
 * @param className Sizing/shape classes (e.g. `"h-4 w-24 rounded-full"`).
 *
 * @author Yordanos Eshete
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
