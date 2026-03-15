import { View } from "react-native"
import { Text } from "@components/core"
import { Image } from "expo-image"
import { CDN_URL } from "@api/util"
import { useState, useMemo } from "react"

/**
 * {@link ClubProfilePicture}
 */
type ClubProfilePictureProps = {
    clubID: string
    displayName: string
    size?: "sm" | "md" | "lg" | "xl"
}

/**
 * A club's profile picture.
 *
 * @param clubID The ID of the club.
 * @param displayName The display name for fallback initials.
 * @param size The size to display the profile picture.
 *
 * @author AJ Kneisl
 */
export default function ClubProfilePicture({
    clubID,
    displayName,
    size = "lg"
}: ClubProfilePictureProps) {
    const [imageError, setImageError] = useState(false)

    const initials = useMemo(
        () =>
            displayName
                .split(" ")
                .slice(0, 2)
                .map((n) => n[0]?.toUpperCase())
                .join("") || "?",
        [displayName]
    )

    const avatarUrl = `${CDN_URL}/avatars/club/${clubID}/avatar`

    const sizeClasses = {
        sm: "h-8 w-8",
        md: "h-12 w-12",
        lg: "h-16 w-16",
        xl: "h-24 w-24"
    }

    const textSizes = {
        sm: 12,
        md: 16,
        lg: 20,
        xl: 32
    }

    return (
        <View
            className={`${sizeClasses[size]} rounded-full overflow-hidden bg-primary shadow-md items-center justify-center`}
        >
            {!imageError ? (
                <Image
                    source={avatarUrl}
                    style={{ width: "100%", height: "100%" }}
                    autoplay={false}
                    onError={() => setImageError(true)}
                />
            ) : (
                <Text
                    className="font-bold text-white"
                    style={{
                        fontSize: textSizes[size],
                        textAlign: "center",
                        textAlignVertical: "center"
                    }}
                >
                    {initials}
                </Text>
            )}
        </View>
    )
}
