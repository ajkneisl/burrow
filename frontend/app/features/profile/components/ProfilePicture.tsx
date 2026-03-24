import { View } from "react-native"
import { Text } from "@components/core"
import { Image } from "expo-image"
import { CDN_URL } from "@api/util"
import { useState, useMemo } from "react"

/**
 * {@link ProfilePicture}
 */
type ProfilePictureProps = {
    name: string
    userID: string
    size?: "sm" | "md" | "lg" | "xl"
}

/**
 * A user's profile picture.
 *
 * @param name The name for fallback if the user doesn't have a profile picture.
 * @param userID The ID of the user.
 * @param size The size to display the profile picture.
 *
 * @author AJ Kneisl
 */
export function ProfilePicture({
    name,
    userID,
    size = "lg"
}: ProfilePictureProps) {
    const [imageError, setImageError] = useState(false)

    const initials = useMemo(
        () =>
            name
                .split(" ")
                .slice(0, 2)
                .map((n) => n[0]?.toUpperCase())
                .join("") || "?",
        [name]
    )

    const avatarUrl = `${CDN_URL}/avatars/user/${userID}/avatar`

    const sizeClasses = {
        sm: "h-8 w-8",
        md: "h-12 w-12",
        lg: "h-16 w-16",
        xl: "h-24 w-24"
    }

    const textSizes = {
        sm: "text-sm pt-1",
        md: "text-base pt-1.5",
        lg: "text-xl pt-2",
        xl: "text-4xl pt-4"
    }

    return (
        <View
            className={`${sizeClasses[size]} rounded-full overflow-hidden bg-primary shadow-md`}
        >
            {!imageError ? (
                <Image
                    source={avatarUrl}
                    style={{ width: "100%", height: "100%" }}
                    autoplay={false}
                    onError={() => setImageError(true)}
                />
            ) : (
                <View className="h-full w-full items-center justify-center bg-primary">
                    <Text
                        className={`${textSizes[size]} font-bold leading-none text-white`}
                    >
                        {initials}
                    </Text>
                </View>
            )}
        </View>
    )
}
