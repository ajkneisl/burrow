import { View, Pressable } from "react-native"
import { useRouter } from "expo-router"
import { ChevronRight } from "lucide-react-native"
import { Card, Button, Text } from "@components/core"
import { ProfilePicture } from "@features/profile/components/ProfilePicture"
import { useThemeColors } from "@api/theme/useThemeColors"

type UserCardAction = {
    label: string
    variant: "primary" | "outline" | "danger"
    icon: React.ReactNode
    onPress: () => void
}

type UserCardProps = {
    userID: string
    name?: string | null
    username: string
    subtitle?: string
    action?: UserCardAction
}

export default function UserCard({
    userID,
    name,
    username,
    subtitle,
    action
}: UserCardProps) {
    const router = useRouter()
    const colors = useThemeColors()

    return (
        <Pressable onPress={() => router.push(`/user/${username}`)}>
            <Card variant="bordered">
                <View className="flex-row items-center">
                    <View className="mr-3">
                        <ProfilePicture
                            name={name || username}
                            userID={userID}
                            size="md"
                        />
                    </View>

                    <View className="flex-1">
                        <Text className="text-text font-semibold">
                            {name || username}
                        </Text>
                        <Text className="text-text text-opacity-60 text-sm">
                            @{username}
                        </Text>
                        {subtitle && (
                            <Text className="text-text text-opacity-50 text-xs mt-0.5">
                                {subtitle}
                            </Text>
                        )}
                    </View>
                    {action ? (
                        <Button
                            variant={action.variant}
                            size="sm"
                            leftIcon={action.icon}
                            onPress={(e) => {
                                e.stopPropagation()
                                action.onPress()
                            }}
                        >
                            {action.label}
                        </Button>
                    ) : (
                        <ChevronRight
                            size={20}
                            color={colors.text}
                            style={{ opacity: 0.4 }}
                        />
                    )}
                </View>
            </Card>
        </Pressable>
    )
}
