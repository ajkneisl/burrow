import { Pressable, Text } from "react-native"

type FilterChipProps = {
    label: string
    active: boolean
    onPress: () => void
}

export function FilterChip({ label, active, onPress }: FilterChipProps) {
    return (
        <Pressable
            onPress={onPress}
            className={`px-4 py-2 rounded-full ${
                active ? "bg-primary dark:bg-primary" : "bg-card dark:bg-card"
            }`}
        >
            <Text
                className={`text-sm font-semibold ${
                    active ? "text-white" : "text-text dark:text-text"
                }`}
            >
                {label}
            </Text>
        </Pressable>
    )
}
