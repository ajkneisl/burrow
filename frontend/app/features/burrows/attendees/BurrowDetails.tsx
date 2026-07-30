import { BurrowResponse, NOT_REOCCURRING, dayLabel, formatDateTime, getReoccurringText } from "@umnburrow/core/api"
import { View } from "react-native"
import { Text } from "@components/core"
import type { LucideIcon } from "lucide-react-native"
import {
    BookOpen,
    Calendar,
    Clock,
    MapPin,
    Repeat,
    Users
} from "lucide-react-native"
import clsx from "clsx"

import { useThemeColors } from "@api/theme/useThemeColors"

/**
 * {@link BurrowDetails}
 */
type BurrowDetailsProps = {
    burrowResponse: BurrowResponse
}

type DetailRow = {
    icon: LucideIcon
    value: string
    subtitle?: string
}

/**
 * Display details about a Burrow as a compact list of facts.
 *
 * @param burrowResponse The Burrow to display details about.
 *
 * @author AJ Kneisl
 */
export default function BurrowDetails({ burrowResponse }: BurrowDetailsProps) {
    const colors = useThemeColors()
    const { burrow } = burrowResponse

    const label = burrow.kind === "PROJECT" ? "members" : "joined"
    const capacityStr = burrow.capacity
        ? `${burrowResponse.joined || 0} of ${burrow.capacity} ${label}`
        : `${burrowResponse.joined || 0} ${label}`

    const rows: DetailRow[] =
        burrow.kind === "PROJECT"
            ? [
                  ...(burrow.location
                      ? [
                            {
                                icon: BookOpen,
                                value: burrow.location,
                                subtitle: "Course"
                            }
                        ]
                      : []),
                  {
                      icon: Calendar,
                      value: `Due ${dayLabel(burrow.endTime)}`
                  },
                  { icon: Users, value: capacityStr }
              ]
            : [
                  {
                      icon:
                          burrow.reoccurring !== NOT_REOCCURRING
                              ? Repeat
                              : Clock,
                      value: formatDateTime(
                          burrow.beginningTime,
                          burrow.endTime
                      ),
                      subtitle:
                          getReoccurringText(burrow.reoccurring) || undefined
                  },
                  ...(burrow.location
                      ? [{ icon: MapPin, value: burrow.location }]
                      : []),
                  { icon: Users, value: capacityStr }
              ]

    return (
        <View>
            {rows.map((row, index) => {
                const Icon = row.icon

                return (
                    <View
                        key={index}
                        className={clsx(
                            "flex-row items-start gap-3",
                            index > 0 && "mt-3.5"
                        )}
                    >
                        <Icon
                            size={18}
                            color={colors.primary}
                            style={{ marginTop: 2 }}
                        />

                        <View className="flex-1">
                            <Text className="text-[15px] text-text leading-5">
                                {row.value}
                            </Text>

                            {row.subtitle && (
                                <Text className="text-xs text-text opacity-50 mt-0.5">
                                    {row.subtitle}
                                </Text>
                            )}
                        </View>
                    </View>
                )
            })}
        </View>
    )
}
