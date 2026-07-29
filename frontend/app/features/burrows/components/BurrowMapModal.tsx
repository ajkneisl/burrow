import { View, StyleSheet, Pressable, ActivityIndicator } from "react-native"
import { Text } from "@components/core"
import { useState, useEffect, useRef } from "react"
import { useAtom } from "jotai"
import { useQuery } from "@tanstack/react-query"
import { useRouter } from "expo-router"
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps"
import * as Location from "expo-location"
import { MapPin, RefreshCw, Navigation } from "lucide-react-native"
import Toast from "react-native-toast-message"
import { Modal } from "@components/core/Modal"
import { mapModalOpen } from "@features/layout/layout.atom"
import { getMap } from "@features/burrows/burrows.api"
import { useThemeColors } from "@api/theme/useThemeColors"

// University of Minnesota coordinates
const UMN_COORDS = {
    latitude: 44.9746,
    longitude: -93.2354,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05
}

/**
 * Full-screen modal displaying burrow locations on a map.
 *
 * @author AJ Kneisl
 */
export function BurrowMapModal() {
    const [open, setOpen] = useAtom(mapModalOpen)
    const colors = useThemeColors()
    const router = useRouter()
    const mapRef = useRef<MapView>(null)
    const [hasPermission, setHasPermission] = useState(false)

    const { data, isLoading, isFetching, refetch } = useQuery({
        queryKey: ["burrows", "map"],
        queryFn: async () => await getMap(),
        enabled: open
    })

    useEffect(() => {
        if (!open) return
        ;(async () => {
            const { status } =
                await Location.requestForegroundPermissionsAsync()
            setHasPermission(status === "granted")
        })()
    }, [open])

    const centerOnCampus = () => {
        mapRef.current?.animateToRegion(UMN_COORDS, 500)
    }

    return (
        <Modal
            visible={open}
            onClose={() => setOpen(false)}
            size="full"
            scrollable={false}
            title="Burrow Map"
        >
            <View className="flex-1">
                <MapView
                    ref={mapRef}
                    provider={PROVIDER_GOOGLE}
                    style={StyleSheet.absoluteFill}
                    initialRegion={UMN_COORDS}
                    showsUserLocation={hasPermission}
                    showsMyLocationButton={false}
                >
                    {data?.map((burrow) => (
                        <Marker
                            key={burrow.burrow.id}
                            coordinate={{
                                latitude: burrow.lat!,
                                longitude: burrow.lng!
                            }}
                            onPress={() => {
                                setOpen(false)
                                router.push(`/burrow/${burrow.burrow.id}`)
                            }}
                        >
                            <View className="items-center">
                                <View className="bg-primary rounded-full w-10 h-10 items-center justify-center shadow-lg">
                                    <MapPin size={20} color="#FFFFFF" />
                                </View>

                                <View className="bg-background px-2 py-1 rounded-md mt-1 shadow-sm">
                                    <Text
                                        className="text-xs font-semibold text-text"
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
                        <View className="bg-background rounded-full px-4 py-2 shadow-lg flex-row items-center gap-2">
                            <ActivityIndicator
                                size="small"
                                color={colors.primary}
                            />
                            <Text className="text-sm text-text">
                                Loading Burrows...
                            </Text>
                        </View>
                    </View>
                )}

                {/* Stats Badge */}
                {!isLoading && (data?.length ?? 0) > 0 && (
                    <View className="absolute top-4 left-0 right-0 items-center">
                        <View className="bg-background rounded-full px-4 py-2 shadow-lg">
                            <Text className="text-sm font-semibold text-text">
                                {data?.length} Burrow
                                {data?.length !== 1 ? "s" : ""} nearby
                            </Text>
                        </View>
                    </View>
                )}

                {/* Map Controls */}
                <View className="absolute bottom-6 right-4 gap-3">
                    {/* Refresh Button */}
                    <Pressable
                        onPress={() => refetch()}
                        disabled={isFetching}
                        className="bg-background rounded-full p-3 shadow-lg active:opacity-70"
                        style={{
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.15,
                            shadowRadius: 4,
                            elevation: 4
                        }}
                    >
                        <RefreshCw
                            size={22}
                            color={colors.primary}
                            style={{ opacity: isFetching ? 0.5 : 1 }}
                        />
                    </Pressable>

                    {/* Center on Campus Button */}
                    <Pressable
                        onPress={centerOnCampus}
                        className="bg-background rounded-full p-3 shadow-lg active:opacity-70"
                        style={{
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.15,
                            shadowRadius: 4,
                            elevation: 4
                        }}
                    >
                        <Navigation size={22} color={colors.secondary} />
                    </Pressable>
                </View>
            </View>
        </Modal>
    )
}
