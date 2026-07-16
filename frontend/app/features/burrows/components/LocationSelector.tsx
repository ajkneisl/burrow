import { useRef, useEffect, useState } from "react"
import { View, Platform } from "react-native"
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete"
import { MapPin } from "lucide-react-native"
import { GlassSurface, glassAvailable } from "@components/core"
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
 * A location selector, styled to match the core Input component.
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
    const [focused, setFocused] = useState(false)

    useEffect(() => {
        if (ref.current && value) {
            ref.current.setAddressText(value)
        }
    }, [value])

    const borderColor = focused
        ? colors.primary
        : glassAvailable
          ? "transparent"
          : colors.cardBorder

    return (
        <View style={{ zIndex: 50 }}>
            {glassAvailable && (
                <GlassSurface
                    className="absolute left-0 right-0 top-0 rounded-lg"
                    style={{ height: 48 }}
                />
            )}

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
                    placeholderTextColor: "#9CA3AF",
                    onFocus: () => setFocused(true),
                    onBlur: () => setFocused(false)
                }}
                styles={{
                    container: {
                        flex: 0
                    },
                    textInputContainer: {
                        flexDirection: "row",
                        alignItems: "center",
                        height: 48,
                        borderWidth: 1,
                        borderColor,
                        borderRadius: 8,
                        backgroundColor: glassAvailable
                            ? "transparent"
                            : colors.card,
                        paddingLeft: 12
                    },
                    textInput: {
                        flex: 1,
                        fontSize: 16,
                        color: colors.text,
                        height: 46,
                        paddingVertical: 0,
                        paddingHorizontal: 16,
                        backgroundColor: "transparent",
                        marginBottom: 0
                    },
                    listView: {
                        borderWidth: 1,
                        borderColor: colors.cardBorder,
                        borderRadius: 8,
                        marginTop: 4,
                        backgroundColor: colors.card,
                        overflow: "hidden"
                    },
                    row: {
                        backgroundColor: colors.card,
                        paddingVertical: 12,
                        paddingHorizontal: 16
                    },
                    separator: {
                        height: 1,
                        backgroundColor: colors.cardBorder
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
