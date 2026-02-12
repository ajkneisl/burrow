import { useThemeColors } from "@api/theme/useThemeColors"
import { useMemo, useState } from "react"
import { CDN_URL } from "@api/util"
import { Image, Text, View } from "react-native"

type ClubProfilePictureProps = {
    clubID: string
    displayName: string
    size: number
}

export default function ClubProfilePicture({
    clubID,
    displayName,
    size
}: ClubProfilePictureProps) {
    const colors = useThemeColors()
    const [error, setError] = useState(false)
    const uri = `${CDN_URL}/avatars/club/${clubID}/avatar`

    const initials = useMemo(
        () =>
            displayName
                .split(" ")
                .slice(0, 2)
                .map((n) => n[0]?.toUpperCase())
                .join(""),
        [displayName]
    )

    return (
        <View
            className={`rounded-full overflow-hidden shadow-lg ${size > 48 ? "border-4" : "border-2"} border-background`}
            style={{ width: size, height: size }}
        >
            {!error ? (
                <Image
                    source={{ uri }}
                    style={{ width: size, height: size }}
                    onError={() => setError(true)}
                />
            ) : (
                <View
                    className="items-center justify-center"
                    style={{
                        width: size,
                        height: size,
                        backgroundColor: colors.primary
                    }}
                >
                    <Text className="text-white font-bold text-2xl">
                        {initials}
                    </Text>
                </View>
            )}
        </View>
    )
}
