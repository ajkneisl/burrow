import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ActivityIndicator
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useState, useEffect } from "react"
import { useRouter } from "expo-router"
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps"
import * as Location from "expo-location"
import { useQuery } from "@tanstack/react-query"
import { Header } from "@features/layout/components"
import { getMap } from "@features/burrows/burrows.api"
import { MapPin } from "lucide-react-native"
import Toast from "react-native-toast-message"
import { useThemeColors } from "@api/theme/useThemeColors"

// University of Minnesota coordinates
const UMN_COORDS = {
    latitude: 44.9746,
    longitude: -93.2354,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05
}

/**
 * A map screen.
 *
 * @author AJ Kneisl
 */
export default function MapScreen() {
    const router = useRouter()
    const colors = useThemeColors()
    const [location, setLocation] = useState<Location.LocationObject | null>(
        null
    )
    const [hasPermission, setHasPermission] = useState(false)

    const { data, isLoading } = useQuery({
        queryKey: ["burrows", "map"],
        queryFn: async () => await getMap()
    })

    useEffect(() => {
        ;(async () => {
            const { status } =
                await Location.requestForegroundPermissionsAsync()
            setHasPermission(status === "granted")

            if (status === "granted") {
                const currentLocation = await Location.getCurrentPositionAsync(
                    {}
                )
                setLocation(currentLocation)
            } else {
                Toast.show({
                    type: "info",
                    text1: "Location permission needed",
                    text2: "Enable location to see nearby Burrows."
                })
            }
        })()
    }, [])

    const initialRegion = location
        ? {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05
          }
        : UMN_COORDS

    return (
        <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
            <Header title="Map" showSearch={false} />

            <View className="flex-1">
                <MapView
                    provider={PROVIDER_GOOGLE}
                    style={StyleSheet.absoluteFillObject}
                    initialRegion={initialRegion}
                    showsUserLocation={hasPermission}
                    showsMyLocationButton={hasPermission}
                >
                    {/* Burrow Markers */}
                    {data?.map((burrow) => (
                        <Marker
                            key={burrow.burrow.id}
                            coordinate={{
                                latitude: burrow.lat!,
                                longitude: burrow.lng!
                            }}
                            onPress={() => {
                                router.push(`/burrow/${burrow.burrow.id}`)
                            }}
                        >
                            <View className="items-center">
                                <View className="bg-primary rounded-full w-10 h-10 items-center justify-center shadow-lg">
                                    <MapPin size={20} color="#FFFFFF" />
                                </View>

                                <View className="bg-background dark:bg-background px-2 py-1 rounded-md mt-1 shadow-sm">
                                    <Text
                                        className="text-xs font-semibold text-text dark:text-text"
                                        numberOfLines={1}
                                    >
                                        {burrow.burrow.title}
                                    </Text>
                                </View>
                            </View>
                        </Marker>
                    ))}
                </MapView>

                {/* Loading Overlay */}
                {isLoading && (
                    <View className="absolute top-4 left-0 right-0 items-center">
                        <View className="bg-background dark:bg-background rounded-full px-4 py-2 shadow-lg flex-row items-center gap-2">
                            <ActivityIndicator size="small" color={colors.primary} />
                            <Text className="text-sm text-text dark:text-text">
                                Loading Burrows...
                            </Text>
                        </View>
                    </View>
                )}

                {/* Stats Badge */}
                {!isLoading && (data?.length ?? 0) > 0 && (
                    <View className="absolute top-4 left-0 right-0 items-center">
                        <View className="bg-background dark:bg-background rounded-full px-4 py-2 shadow-lg">
                            <Text className="text-sm font-semibold text-text dark:text-text">
                                {data?.length} Burrow
                                {data?.length !== 1 ? "s" : ""} nearby
                            </Text>
                        </View>
                    </View>
                )}
            </View>
        </SafeAreaView>
    )
}
