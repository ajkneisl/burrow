import { BurrowKind } from "@umnburrow/core/api"
import { View, Pressable } from "react-native"
import { Text } from "@components/core"
import { SafeAreaView } from "react-native-safe-area-context"
import {
    X,
    BookOpen,
    PartyPopper,
    Users,
    FolderKanban
} from "lucide-react-native"
import ThemedIcon from "@components/core/ThemedIcon"

/**
 * {@link BurrowTypeSelector}
 */
type BurrowTypeSelectorProps = {
    onSelect: (type: BurrowKind) => void
    onClose: () => void
}

const BURROW_TYPES: {
    type: BurrowKind
    label: string
    description: string
    icon: typeof BookOpen
    color: string
}[] = [
    {
        type: "STUDY",
        label: "Study Group",
        description: "Create a study group",
        icon: BookOpen,
        color: "#10B981"
    },
    {
        type: "EVENT",
        label: "Event",
        description: "Plan or host an event",
        icon: PartyPopper,
        color: "#FFCC33"
    },
    {
        type: "CLUB",
        label: "Club",
        description: "Meet with your club",
        icon: Users,
        color: "#3B82F6"
    },
    {
        type: "PROJECT",
        label: "Project",
        description: "Collaborate with classmates on projects",
        icon: FolderKanban,
        color: "#EF4444"
    }
]

/**
 * Select the type of burrow to create.
 *
 * @param onSelect Called when a burrow type is selected.
 * @param onClose Called when the selector is dismissed.
 *
 * @author AJ Kneisl
 */
export function BurrowTypeSelector({
    onSelect,
    onClose
}: BurrowTypeSelectorProps) {
    return (
        <SafeAreaView className="flex-1 bg-background">
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
                <Text className="text-xl font-bold text-text">
                    Create Burrow
                </Text>
                <Pressable onPress={onClose}>
                    <ThemedIcon icon={X} size={24} />
                </Pressable>
            </View>

            {/* Content */}
            <View className="flex-1 px-6 py-8">
                <Text className="text-base text-text text-opacity-80 mb-6">
                    Choose the type of burrow you want to create:
                </Text>

                <View className="gap-4">
                    {BURROW_TYPES.map((burrowType) => {
                        const Icon = burrowType.icon

                        return (
                            <Pressable
                                key={burrowType.type}
                                onPress={() => onSelect(burrowType.type)}
                                className="flex-row items-center p-5 bg-card rounded-lg border border-card-border active:bg-opacity-60"
                            >
                                {/* Icon */}
                                <View
                                    className="w-14 h-14 rounded-full items-center justify-center mr-4"
                                    style={{
                                        backgroundColor: `${burrowType.color}20`
                                    }}
                                >
                                    <Icon size={28} color={burrowType.color} />
                                </View>

                                {/* Text */}
                                <View className="flex-1">
                                    <Text className="text-lg font-bold text-text mb-1">
                                        {burrowType.label}
                                    </Text>
                                    <Text className="text-sm text-text text-opacity-60">
                                        {burrowType.description}
                                    </Text>
                                </View>
                            </Pressable>
                        )
                    })}
                </View>
            </View>
        </SafeAreaView>
    )
}
