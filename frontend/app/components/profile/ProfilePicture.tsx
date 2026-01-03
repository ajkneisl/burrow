import { View, Image, Text } from "react-native"
import { CDN_URL } from "@api/util"
import { useState, useMemo } from "react"

type ProfilePictureProps = {
    name: string
    userID: string
    size?: "sm" | "md" | "lg"
}

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
        lg: "h-16 w-16"
    }

    const textSizes = {
        sm: "text-sm",
        md: "text-base",
        lg: "text-xl"
    }

    return (
        <View
            className={`${sizeClasses[size]} rounded-full overflow-hidden bg-primary shadow-md`}
        >
            {!imageError ? (
                <Image
                    source={{ uri: avatarUrl }}
                    className="h-full w-full"
                    onError={() => setImageError(true)}
                />
            ) : (
                <View className="h-full w-full items-center justify-center bg-primary">
                    <Text className={`${textSizes[size]} font-bold text-white`}>
                        {initials}
                    </Text>
                </View>
            )}
        </View>
    )
}
