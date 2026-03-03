import { Alert, Linking, Pressable, Text } from "react-native"

/**
 * A social button.
 *
 * @param icon The icon;.
 * @param label The label.
 * @param url The URL.
 * @constructor
 */
export default function ProfileSocialButton({
    icon,
    label,
    url
}: {
    icon: React.ReactNode
    label: string
    url: string
}) {
    const handlePress = async () => {
        try {
            const supported = await Linking.canOpenURL(url)
            if (supported) {
                await Linking.openURL(url)
            } else {
                Alert.alert("Error", `Cannot open ${label} link`)
            }
        } catch {
            Alert.alert("Error", `Failed to open ${label} link`)
        }
    }

    return (
        <Pressable
            onPress={handlePress}
            className="flex-1 flex-row items-center justify-center gap-2 bg-card border border-card-border rounded-full py-3 px-4 active:opacity-70"
        >
            {icon}
            <Text className="text-text text-sm font-medium">{label}</Text>
        </Pressable>
    )
}
