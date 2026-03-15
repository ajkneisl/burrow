import { View } from "react-native"
import { Text } from "@components/core"
import {
    BookOpen,
    Calendar,
    Clock,
    MapPin,
    Repeat,
    Users
} from "lucide-react-native"
import { dayLabel, formatDateTime } from "@api/util"
import ThemedIcon from "@components/core/ThemedIcon"
import {
    NOT_REOCCURRING,
    getReoccurringText,
    BurrowResponse
} from "@features/burrows/burrows.types"
import { useThemeColors } from "@api/theme/useThemeColors"

/**
 * {@link BurrowDetails}
 */
type BurrowDetailsProps = {
    burrowResponse: BurrowResponse
}

/**
 * Display details about a Burrow.
 *
 * @param burrow The Burrow to display details about.
 *
 * @author AJ Kneisl
 */
export default function BurrowDetails({ burrowResponse }: BurrowDetailsProps) {
    const { burrow } = burrowResponse

    const label = burrow.kind === "PROJECT" ? "members" : "joined"
    const capacityStr = burrow.capacity
        ? `${burrowResponse.joined || 0}/${burrow.capacity} ${label}`
        : `${burrowResponse.joined || 0} ${label}`

    return (
        <View className="gap-4">
            {burrow.kind === "PROJECT" ? (
                <>
                    {/* course name */}
                    {burrow.className && (
                        <DetailRow
                            icon={
                                <ThemedIcon
                                    icon={BookOpen}
                                    size={20}
                                    overrideColor={"secondary"}
                                />
                            }
                            label="Course"
                            value={burrow.className}
                        />
                    )}

                    {/* due date */}
                    <DetailRow
                        icon={
                            <ThemedIcon
                                icon={Calendar}
                                size={20}
                                overrideColor={"primary"}
                            />
                        }
                        label="Due Date"
                        value={dayLabel(burrow.endTime)}
                    />
                </>
            ) : (
                <>
                    {/* date */}
                    <DetailRow
                        icon={
                            <ThemedIcon
                                icon={
                                    burrow.reoccurring !== NOT_REOCCURRING
                                        ? Repeat
                                        : Clock
                                }
                                size={20}
                                overrideColor={"primary"}
                            />
                        }
                        label="When"
                        value={formatDateTime(
                            burrow.beginningTime,
                            burrow.endTime
                        )}
                        subtitle={getReoccurringText(burrow.reoccurring)}
                    />

                    {/* location */}
                    {burrow.location && (
                        <DetailRow
                            icon={
                                <ThemedIcon
                                    icon={MapPin}
                                    size={20}
                                    overrideColor={"primary"}
                                />
                            }
                            label="Where"
                            value={burrow.location}
                        />
                    )}
                </>
            )}

            <DetailRow
                icon={
                    <ThemedIcon
                        icon={Users}
                        size={20}
                        overrideColor={"primary"}
                    />
                }
                label={burrow.kind === "PROJECT" ? "Team Size" : "Capacity"}
                value={capacityStr}
            />
        </View>
    )
}

/**
 * A row of details.
 *
 * @param icon The icon describing the details.
 * @param label Label
 * @param value Value
 */
function DetailRow({
    icon,
    label,
    value,
    subtitle
}: {
    icon: React.ReactNode
    label: string
    value: string
    subtitle?: string
}) {
    const colors = useThemeColors()

    return (
        <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-card items-center justify-center mr-3">
                {icon}
            </View>
            <View className="flex-1">
                <Text className="text-xs text-text text-opacity-50 uppercase tracking-wide">
                    {label}
                </Text>
                <Text className="text-base text-text font-medium mt-0.5">
                    {value}
                </Text>
                {subtitle ? (
                    <Text
                        className="text-xs mt-0.5"
                        style={{ color: `${colors.text}9A` }}
                    >
                        {subtitle}
                    </Text>
                ) : null}
            </View>
        </View>
    )
}
