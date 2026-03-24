import { useEffect, useRef, useState } from "react"
import { Animated, Pressable, View, Modal as RNModal } from "react-native"
import { Text } from "@components/core"
import { Image } from "expo-image"
import { CDN_URL } from "@api/util"

/**
 * {@link UserBadge}
 */
type UserBadgeProps = {
    id: string
    description: string
}

/**
 * A user's badge.
 *
 * @param id The badge ID.
 * @param description The badge description.
 *
 * @author AJ Kneisl
 */
export function UserBadge({ id, description }: UserBadgeProps) {
    const [showTooltip, setShowTooltip] = useState(false)
    const opacity = useRef(new Animated.Value(0)).current

    useEffect(() => {
        Animated.timing(opacity, {
            toValue: showTooltip ? 1 : 0,
            duration: 150,
            useNativeDriver: true,
        }).start()
    }, [showTooltip, opacity])

    return (
        <View>
            <Pressable
                onPress={() => setShowTooltip((prev) => !prev)}
                className="active:opacity-70"
            >
                <Image
                    source={`${CDN_URL}/badges/${id}`}
                    style={{ width: 48, height: 48 }}
                    contentFit="contain"
                />
            </Pressable>

            {showTooltip && (
                <RNModal transparent visible onRequestClose={() => setShowTooltip(false)}>
                    <Pressable
                        className="flex-1"
                        onPress={() => setShowTooltip(false)}
                    />
                </RNModal>
            )}

            <Animated.View
                pointerEvents={showTooltip ? "auto" : "none"}
                style={{ opacity }}
                className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 min-w-[120px] rounded-md bg-background px-3 py-1.5 shadow-md"
            >
                <Text className="text-xs text-text text-center">
                    {description}
                </Text>
            </Animated.View>
        </View>
    )
}
