import { View, Text, Pressable } from "react-native"
import { useRouter } from "expo-router"
import { Calendar, MapPin, Users, Clock } from "lucide-react-native"
import { Card } from "@components/core"
import { formatDateTime } from "@api/util"
import type { Burrow, BurrowType } from "../burrows.types"
import { useThemeColors } from "@api/theme/useThemeColors"

interface BurrowCardProps {
    burrow: Burrow
}

export function BurrowCard({ burrow }: BurrowCardProps) {
    const router = useRouter()
    const colors = useThemeColors()

    const handlePress = () => {
        if (burrow.type === "PROJECT") {
            router.push(`/project/${burrow.id}`)
        } else {
            router.push(`/burrow/${burrow.id}`)
        }
    }

    const typeColors = {
        STUDY: "bg-info/10 text-info",
        EVENT: "bg-success/10 text-success",
        CLUB: "bg-warn/10 text-warn",
        PROJECT: "bg-primary/10 text-primary"
    }

    const typeColor = typeColors[burrow.type] || typeColors.STUDY

    return (
        <Pressable onPress={handlePress}>
            <Card variant="bordered" className="mb-3">
                {/* Header */}
                <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-1 mr-3">
                        <Text
                            className="text-lg font-bold text-text"
                            numberOfLines={2}
                        >
                            {burrow.title}
                        </Text>
                        {burrow.description && (
                            <Text
                                className="text-sm text-text text-opacity-60 mt-1"
                                numberOfLines={2}
                            >
                                {burrow.description}
                            </Text>
                        )}
                    </View>
                    <View className={`px-3 py-1 rounded-full ${typeColor}`}>
                        <Text className="text-xs font-semibold">
                            {burrow.type}
                        </Text>
                    </View>
                </View>

                {/* Details */}
                <View className="space-y-2">
                    {burrow.beginningTime && burrow.endTime && (
                        <DetailRow
                            icon={<Calendar size={16} color={colors.text} style={{ opacity: 0.6 }} />}
                            text={formatDateTime(
                                burrow.beginningTime,
                                burrow.endTime
                            )}
                        />
                    )}

                    {burrow.location && (
                        <DetailRow
                            icon={<MapPin size={16} color={colors.text} style={{ opacity: 0.6 }} />}
                            text={burrow.location}
                        />
                    )}

                    <DetailRow
                        icon={<Users size={16} color={colors.text} style={{ opacity: 0.6 }} />}
                        text={`${burrow.joined || 0}${burrow.capacity ? `/${burrow.capacity}` : ""} members`}
                    />
                </View>

                {/* Tags */}
                {burrow.tags && burrow.tags.length > 0 && (
                    <View className="flex-row flex-wrap gap-2 mt-3">
                        {burrow.tags.slice(0, 3).map((tag, index) => (
                            <View
                                key={index}
                                className="bg-card px-2 py-1 rounded-md"
                            >
                                <Text className="text-xs text-text text-opacity-80">
                                    {tag}
                                </Text>
                            </View>
                        ))}
                        {burrow.tags.length > 3 && (
                            <View className="bg-card px-2 py-1 rounded-md">
                                <Text className="text-xs text-text text-opacity-80">
                                    +{burrow.tags.length - 3}
                                </Text>
                            </View>
                        )}
                    </View>
                )}
            </Card>
        </Pressable>
    )
}

function DetailRow({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <View className="flex-row items-center gap-2">
            {icon}
            <Text className="text-sm text-text text-opacity-80 flex-1">{text}</Text>
        </View>
    )
}
