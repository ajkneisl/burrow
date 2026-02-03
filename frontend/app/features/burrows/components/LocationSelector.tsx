import { useRef, useEffect } from "react"
import { View, Platform, Text } from "react-native"
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete"
import { MapPin } from "lucide-react-native"
import { useThemeColors } from "@api/theme/useThemeColors"
import Constants from "expo-constants"

/**
 * {@link LocationSelector}
 */
interface LocationSelectorProps {
    value: string
    onLocationSelect: (location: {
        address: string
        latitude?: number
        longitude?: number
    }) => void
    placeholder?: string
}

/**
 * A location selector.
 *
 * @param value The initial value. This should change depending on {@link onLocationSelect}.
 * @param onLocationSelect When the location is selected.
 * @param placeholder Placeholder text before finding the location.
 *
 * @author AJ Kneisl
 */
export function LocationSelector({
    value,
    onLocationSelect,
    placeholder = "Search for a location..."
}: LocationSelectorProps) {
    const colors = useThemeColors()
    const ref = useRef<any>(null)

    useEffect(() => {
        if (ref.current && value) {
            ref.current.setAddressText(value)
        }
    }, [value])

    const borderColor = colors.cardBorder

    return (
        <View style={{ zIndex: 50 }}>
            <GooglePlacesAutocomplete
                ref={ref}
                placeholder={placeholder}
                onPress={(data, details) => {
                    onLocationSelect({
                        address: data.description,
                        latitude: details?.geometry?.location?.lat,
                        longitude: details?.geometry?.location?.lng
                    })
                }}
                query={{
                    key: Constants.expoConfig?.extra?.googleMapsApiKey?.[
                        Platform.OS
            ],
                    language: "en",
                    components: "country:us"
                }}
                fetchDetails
                enablePoweredByContainer={false}
                debounce={300}
                minLength={2}
                textInputProps={{
                    placeholderTextColor: "#9CA3AF"
                }}
                styles={{
                    container: {
                        flex: 0
                    },
                    textInputContainer: {
                        flexDirection: "row",
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor,
                        borderRadius: 8,
                        backgroundColor: colors.background,
                        paddingLeft: 16
                    },
                    textInput: {
                        flex: 1,
                        fontSize: 16,
                        color: colors.text,
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        backgroundColor: "transparent",
                        marginBottom: 0
                    },
                    listView: {
                        borderWidth: 1,
                        borderColor,
                        borderRadius: 8,
                        marginTop: 4,
                        backgroundColor: colors.background
                    },
                    row: {
                        backgroundColor: colors.background,
                        paddingVertical: 12,
                        paddingHorizontal: 16
                    },
                    separator: {
                        height: 1,
                        backgroundColor: borderColor
                    },
                    description: {
                        color: colors.text,
                        fontSize: 14
                    }
                }}
                renderLeftButton={() => (
                    <MapPin
                        size={20}
                        color={colors.text}
                        style={{ opacity: 0.6 }}
                    />
                )}
            />
        </View>
    )
}
