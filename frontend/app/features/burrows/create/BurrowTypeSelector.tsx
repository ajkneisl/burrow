import { View, Text, Pressable, SafeAreaView } from "react-native"
import {
    X,
    BookOpen,
    PartyPopper,
    Users,
    FolderKanban
} from "lucide-react-native"
import type { BurrowType } from "@features/burrows/burrows.types"
import { useThemeColors } from "@api/theme/useThemeColors"

type BurrowTypeSelectorProps = {
    onSelect: (type: BurrowType) => void
    onClose: () => void
}

const BURROW_TYPES: {
    type: BurrowType
    label: string
    description: string
    icon: typeof BookOpen
    color: string
}[] = [
    {
        type: "STUDY",
        label: "Study Group",
        description: "Collaborate on coursework and exams",
        icon: BookOpen,
        color: "#10B981"
    },
    {
        type: "EVENT",
        label: "Event",
        description: "Plan social gatherings and activities",
        icon: PartyPopper,
        color: "#FFCC33"
    },
    {
        type: "CLUB",
        label: "Club",
        description: "Create a student organization or club",
        icon: Users,
        color: "#3B82F6"
    },
    {
        type: "PROJECT",
        label: "Project",
        description: "Manage team projects and deadlines",
        icon: FolderKanban,
        color: "#EF4444"
    }
]

export function BurrowTypeSelector({
    onSelect,
    onClose
}: BurrowTypeSelectorProps) {
    const colors = useThemeColors()

    return (
        <SafeAreaView className="flex-1 bg-background">
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
                <Text className="text-xl font-bold text-text">
                    Create Burrow
                </Text>
                <Pressable onPress={onClose}>
                    <X size={24} color={colors.text} />
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

                {/* Info */}
                <View className="mt-8 bg-primary/10 rounded-lg p-4">
                    <Text className="text-sm text-text text-opacity-80">
                        💡 Tip: You can change most settings after creating your
                        burrow.
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    )
}
