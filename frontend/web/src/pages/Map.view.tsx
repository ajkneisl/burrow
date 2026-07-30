import { capitalizeFirstLetter, formatDateTime, getMap } from "@umnburrow/core/api"
import type { BurrowLocation } from "@umnburrow/core/api"
import { useState } from "react"
import { Map as GMap, AdvancedMarker } from "@vis.gl/react-google-maps"
import { useQuery } from "@tanstack/react-query"
import { X, MapPin } from "lucide-react"
import { Button } from "@umnburrow/core"
import { useNavigate } from "react-router"
// center of campus
const UMN_CENTER = {
    lat: 44.9744,
    lng: -93.2277
}

/**
 * A map that shows the locations of all Burrows.
 *
 * @author AJ Kneisl
 */
export default function MapView() {
    const nav = useNavigate()

    const [selectedBurrow, setSelectedBurrow] = useState<BurrowLocation | null>(
        null
    )

    // burrows
    const { data: burrowLocations, isLoading } = useQuery<BurrowLocation[]>({
        queryKey: ["burrowMap"],
        queryFn: async () => await getMap()
    })

    return (
        <div className="flex h-screen w-full flex-col">
            {/* header */}
            <div className="border-border border-b bg-background p-4">
                <h1 className="text-2xl font-bold text-text">Burrow Map</h1>
                <p className="text-sm text-text/60">
                    Find active Burrows around the University of Minnesota
                    campus
                </p>
            </div>

            {/* map contianer */}
            <div className="relative flex-1">
                {isLoading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
                        <div className="text-text">Loading Burrows...</div>
                    </div>
                )}

                <GMap
                    defaultCenter={UMN_CENTER}
                    defaultZoom={15}
                    mapId="burrow-map"
                    disableDefaultUI={false}
                    className="size-full"
                >
                    {burrowLocations?.map((burrowLocation) => (
                        <AdvancedMarker
                            key={burrowLocation.burrow.id}
                            position={{
                                lat: burrowLocation.lat,
                                lng: burrowLocation.lng
                            }}
                            onClick={() => setSelectedBurrow(burrowLocation)}
                            title={burrowLocation.burrow.title}
                        >
                            <div className="flex cursor-pointer flex-col items-center transition-transform hover:scale-110">
                                <div className="flex size-10 items-center justify-center rounded-full bg-primary shadow-lg">
                                    <MapPin size={20} color="#FFFFFF" />
                                </div>
                                <div className="mt-1 rounded-md bg-background px-2 py-1 shadow-sm">
                                    <span className="max-w-30 truncate text-xs font-semibold text-text">
                                        {burrowLocation.burrow.title}
                                    </span>
                                </div>
                            </div>
                        </AdvancedMarker>
                    ))}
                </GMap>

                {/* burrow info */}
                {selectedBurrow && (
                    <div className="border-border absolute inset-x-4 bottom-4 max-w-md rounded-lg border bg-background p-4 shadow-lg md:right-auto">
                        <div className="flex w-full items-start justify-between">
                            <div className="flex flex-row items-center gap-2">
                                <h3 className="text-lg font-semibold text-text">
                                    {selectedBurrow.burrow.title}
                                </h3>

                                <p className="text-sm text-text/60">
                                    {formatDateTime(
                                        selectedBurrow.burrow.beginningTime,
                                        selectedBurrow.burrow.endTime
                                    )}
                                </p>
                            </div>

                            <button
                                onClick={() => setSelectedBurrow(null)}
                                className="cursor-pointer text-text/60 hover:text-text"
                            >
                                <X />
                            </button>
                        </div>

                        <span className="text-xs text-text/60 ">
                            {capitalizeFirstLetter(
                                selectedBurrow.burrow.kind.toLowerCase()
                            )}
                        </span>

                        <p className="mb-2 text-sm text-text/80">
                            {selectedBurrow.burrow.location}
                        </p>

                        <p className="mb-3 text-sm text-text/60">
                            {selectedBurrow.burrow.description}
                        </p>

                        <Button
                            className="mt-4 w-full"
                            color="PRIMARY"
                            onClick={() =>
                                nav(`/burrow/${selectedBurrow.burrow.id}`)
                            }
                        >
                            View Burrow
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
