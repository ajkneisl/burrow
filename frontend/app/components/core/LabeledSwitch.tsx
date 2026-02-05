import { View, Text, Switch } from "react-native"
import { useThemeColors } from "@api/theme/useThemeColors"

type LabeledSwitchProps = {
    label: string
    value: boolean
    onValueChange: (value: boolean) => void
}

export function LabeledSwitch({
    label,
    value,
    onValueChange
}: LabeledSwitchProps) {
    const colors = useThemeColors()

    return (
        <View className="flex-row items-center justify-between gap-2 flex-1">
            <Text className="text-text text-md font-semibold">{label}</Text>

            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{
                    false: colors.card,
                    true: colors.primary
                }}
                thumbColor="#FFFFFF"
            />
        </View>
    )
}
