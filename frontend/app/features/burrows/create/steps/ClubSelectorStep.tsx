import { useState, useMemo } from "react"
import {
    View,
    Text,
    ScrollView,
    Pressable,
    Image,
    ActivityIndicator
} from "react-native"
import { useQuery } from "@tanstack/react-query"
import { Users, Check } from "lucide-react-native"
import { get } from "@api/api"
import { CDN_URL } from "@api/util"
import { useThemeColors } from "@api/theme/useThemeColors"
import type { MyClubResponse } from "@features/clubs/club.types"
import type { CreateStepProps } from "../create.types"

/**
 * Step for selecting which club a club burrow belongs to.
 *
 * @author AJ Kneisl
 */
export function ClubSelectorStep({
    formState,
    updateField,
    errors
}: CreateStepProps) {
    const colors = useThemeColors()

    const { data: myClubs, isLoading } = useQuery<MyClubResponse[]>({
        queryKey: ["clubs", "mine"],
        queryFn: async () => await get("/clubs/mine")
    })

    // Only show clubs where user is admin or moderator
    const eligibleClubs = useMemo(
        () =>
            (myClubs ?? []).filter(
                (mc) =>
                    mc.membership.role === "ADMINISTRATOR" ||
                    mc.membership.role === "MODERATOR"
            ),
        [myClubs]
    )

    return (
        <ScrollView
            className="flex-1 px-6"
            showsVerticalScrollIndicator={false}
        >
            {/* Info Card */}
            <View className="bg-card rounded-lg border border-card-border p-4 mb-6">
                <Text className="text-text text-sm font-semibold mb-2">
                    Select Club
                </Text>
                <Text className="text-text text-opacity-60 text-xs">
                    Choose which club this burrow will be created under.
                    Only clubs where you are an administrator or moderator
                    are shown.
                </Text>
            </View>

            {isLoading ? (
                <View className="items-center justify-center py-12">
                    <ActivityIndicator
                        size="large"
                        color={colors.primary}
                    />
                </View>
            ) : eligibleClubs.length === 0 ? (
                <View className="items-center justify-center py-12">
                    <Users
                        size={48}
                        color={colors.text}
                        style={{ opacity: 0.3 }}
                    />
                    <Text className="text-text text-opacity-60 text-center mt-4">
                        No eligible clubs
                    </Text>
                    <Text className="text-text text-opacity-40 text-center text-sm mt-2">
                        You need to be an administrator or moderator of a
                        club to create a club burrow.
                    </Text>
                </View>
            ) : (
                <View className="gap-3">
                    {eligibleClubs.map((mc) => (
                        <ClubOption
                            key={mc.club.id}
                            mc={mc}
                            selected={formState.clubID === mc.club.id}
                            onPress={() =>
                                updateField("clubID", mc.club.id)
                            }
                            colors={colors}
                        />
                    ))}
                </View>
            )}

            {errors.clubID && (
                <Text className="text-sm text-error mt-3">
                    {errors.clubID}
                </Text>
            )}

            <View className="h-32" />
        </ScrollView>
    )
}

function ClubOption({
    mc,
    selected,
    onPress,
    colors
}: {
    mc: MyClubResponse
    selected: boolean
    onPress: () => void
    colors: ReturnType<typeof useThemeColors>
}) {
    const [imageError, setImageError] = useState(false)

    const initials = useMemo(
        () =>
            mc.club.displayName
                .split(" ")
                .slice(0, 2)
                .map((n) => n[0]?.toUpperCase())
                .join(""),
        [mc.club.displayName]
    )

    return (
        <Pressable
            onPress={onPress}
            style={{
                backgroundColor: selected
                    ? `${colors.primary}2A`
                    : colors.background
            }}
            className={`flex-row items-center p-4 rounded-xl border ${
                selected ? "border-primary" : "border-card-border"
            } active:opacity-80`}
        >
            {/* Avatar */}
            <View className="h-12 w-12 rounded-full overflow-hidden bg-primary/10 items-center justify-center mr-3">
                {!imageError ? (
                    <Image
                        source={{
                            uri: `${CDN_URL}/avatars/club/${mc.club.id}/avatar`
                        }}
                        className="h-12 w-12"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <Text className="text-primary font-bold text-lg">
                        {initials}
                    </Text>
                )}
            </View>

            {/* Info */}
            <View className="flex-1 min-w-0">
                <Text
                    className={`font-semibold text-base ${
                        selected ? "text-primary" : "text-text"
                    }`}
                    numberOfLines={1}
                >
                    {mc.club.displayName}
                </Text>
                <Text className="text-text opacity-50 text-xs">
                    {mc.membership.role === "ADMINISTRATOR"
                        ? "Administrator"
                        : "Moderator"}
                </Text>
            </View>

            {/* Check */}
            <View
                className={`w-6 h-6 rounded-full items-center justify-center ${
                    selected ? "bg-primary" : "border-2 border-card-border"
                }`}
            >
                {selected && (
                    <Check size={14} color="#FFFFFF" strokeWidth={3} />
                )}
            </View>
        </Pressable>
    )
}
