import {
    type ClubLink,
    ClubResponse,
    LINK_CONFIG
} from "@features/clubs/club.types"
import { Linking, Pressable, View } from "react-native"
import { Text } from "@components/core"
import { useThemeColors } from "@api/theme/useThemeColors"

/**
 * {@link ClubDetails}
 */
type ClubDetailsProps = {
    clubResponse: ClubResponse
}

/**
 * The about section of a club.
 *
 * @param clubResponse The club response from the API.
 * @author AJ Kneisl
 */
export default function ClubDetails({ clubResponse }: ClubDetailsProps) {
    const { club } = clubResponse

    const colors = useThemeColors()

    return (
        <View>
            <Text className="text-text font-semibold text-sm mb-2">About</Text>
            <Text className="text-text opacity-70 text-sm leading-5">
                {club.description || "No description provided."}
            </Text>

            {Object.keys(club.links ?? {}).length > 0 && (
                <View className="flex-row flex-wrap gap-2 mt-3">
                    {(
                        Object.entries(club.links ?? {}) as [ClubLink, string][]
                    ).map(([type, value]) => {
                        const config = LINK_CONFIG[type]
                        if (!config) return null
                        const Icon = config.icon

                        return (
                            <Pressable
                                key={type}
                                onPress={() =>
                                    Linking.openURL(config.toUrl(value))
                                }
                                className="flex-row items-center gap-1.5 rounded-full border border-card-border bg-card px-3 py-1.5"
                            >
                                <Icon
                                    size={14}
                                    color={colors.text}
                                    style={{ opacity: 0.6 }}
                                />
                                <Text className="text-text opacity-70 text-xs font-medium">
                                    {config.label}
                                </Text>
                            </Pressable>
                        )
                    })}
                </View>
            )}
        </View>
    )
}
