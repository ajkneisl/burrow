import { Text, View } from "react-native"

/**
 * A row of info on the profile.
 *
 * @param icon The icon.
 * @param label The label.
 * @param value The value.
 */
export default function ProfileInfoRow({
    icon,
    label,
    value
}: {
    icon: React.ReactNode
    label: string
    value: string
}) {
    return (
        <View className="flex-row items-center">
            <View className="mr-3">{icon}</View>
            <View className="flex-1">
                <Text className="text-xs text-text text-opacity-60 mb-0.5">
                    {label}
                </Text>
                <Text className="text-base text-text">{value}</Text>
            </View>
        </View>
    )
}
