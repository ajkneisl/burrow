import {
    AutocompleteInput,
    Input,
    type AutocompleteOption
} from "@umnburrow/core"
import { useMapsLibrary } from "@vis.gl/react-google-maps"
import { useState, useEffect, useCallback } from "react"

/**
 * Minnesota's geographical boundaries for filtering autocomplete results.
 */
const MN_BOUNDS = {
    south: 43.0,
    west: -97.5,
    north: 49.5,
    east: -89.0
}

/**
 * {@link LocationSelector}
 */
interface LocationSelectorProps {
    value: string
    onChange: (value: string) => void
    error?: boolean
    placeholder?: string
    restrictToMinnesota?: boolean
}

/**
 * A location selector component.
 *
 * @param value The current location value
 * @param onChange Callback when location changes
 * @param error Whether to show error state
 * @param placeholder Placeholder text for the input
 * @param restrictToMinnesota Whether to restrict autocomplete results to Minnesota.
 *
 * @author AJ Kneisl
 */
export default function LocationSelector({
    value,
    onChange,
    error = false,
    placeholder = "Search for a location...",
    restrictToMinnesota = true
}: LocationSelectorProps) {
    const places = useMapsLibrary("places")
    const [predictions, setPredictions] = useState<AutocompleteOption[]>([])
    const [autocompleteService, setAutocompleteService] =
        useState<google.maps.places.AutocompleteService | null>(null)
    const [placesService, setPlacesService] =
        useState<google.maps.places.PlacesService | null>(null)

    // initialize autocomplete
    useEffect(() => {
        if (!places) return

        setAutocompleteService(new places.AutocompleteService())

        const div = document.createElement("div")
        setPlacesService(new places.PlacesService(div))
    }, [places])

    // get predictions
    const fetchPredictions = useCallback(
        (input: string) => {
            if (!autocompleteService || !input.trim()) {
                setPredictions([])
                return
            }

            const request: google.maps.places.AutocompletionRequest = {
                input
            }

            // add mn bounds
            if (restrictToMinnesota) {
                request.locationBias = {
                    south: MN_BOUNDS.south,
                    west: MN_BOUNDS.west,
                    north: MN_BOUNDS.north,
                    east: MN_BOUNDS.east
                }
                request.componentRestrictions = { country: "us" }
            }

            void autocompleteService.getPlacePredictions(
                request,
                (predictions, status) => {
                    if (
                        status === places?.PlacesServiceStatus.OK &&
                        predictions
                    ) {
                        setPredictions(
                            predictions.map((p) => ({
                                label: p.description,
                                value: p.place_id
                            }))
                        )
                    } else {
                        setPredictions([])
                    }
                }
            )
        },
        [autocompleteService, places, restrictToMinnesota]
    )

    // handle when user selects a place from autocomplete
    const handlePlaceSelect = useCallback(
        (option: AutocompleteOption) => {
            if (!placesService) return

            placesService.getDetails(
                { placeId: option.value },
                (place, status) => {
                    if (status === places?.PlacesServiceStatus.OK && place) {
                        const locationString =
                            place.formatted_address ||
                            place.name ||
                            option.label
                        onChange(locationString)
                    }
                }
            )
        },
        [placesService, places, onChange]
    )

    // if places API is not loaded, fall back to a simple text input
    if (!places) {
        return (
            <Input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                error={error}
                placeholder={placeholder}
            />
        )
    }

    return (
        <AutocompleteInput
            value={value}
            onChange={(e) => {
                onChange(e.target.value)
                fetchPredictions(e.target.value)
            }}
            options={predictions}
            onSelect={handlePlaceSelect}
            placeholder={placeholder}
            error={error}
            noOptionsText="Find the perfect spot"
        />
    )
}
