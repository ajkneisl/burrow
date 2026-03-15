import { View } from "react-native"
import { Text } from "@components/core"
import { WifiOff } from "lucide-react-native"
import { useNetworkStatus } from "@lib/hooks/useNetworkStatus"

/**
 * Displays a banner when the device is offline.
 */
export function OfflineIndicator() {
    const isOnline = useNetworkStatus()

    if (isOnline) {
        return null
    }

    return (
        <View className="bg-error px-4 py-3 flex-row items-center justify-center">
            <WifiOff size={16} color="#FFFFFF" />
            <Text className="text-white font-semibold ml-2">
                No Internet Connection
            </Text>
        </View>
    )
}
