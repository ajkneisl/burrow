import { useThemeColors } from "@api/theme/useThemeColors"
import { useState } from "react"
import { CDN_URL } from "@api/util"
import { Image, View } from "react-native"

type ClubBannerPictureProps = { clubID: string }

export default function ClubBannerPicture({ clubID }: ClubBannerPictureProps) {
    const colors = useThemeColors()
    const [error, setError] = useState(false)
    const uri = `${CDN_URL}/avatars/club/${clubID}/banner`

    if (error) {
        return (
            <View
                className="h-32 w-full"
                style={{ backgroundColor: colors.primary + "20" }}
            />
        )
    }

    return (
        <Image
            source={{ uri }}
            className="h-32 w-full"
            resizeMode="cover"
            onError={() => setError(true)}
        />
    )
}
