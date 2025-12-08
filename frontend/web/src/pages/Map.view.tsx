import { useState } from "react"
import { Map as GMap, AdvancedMarker } from "@vis.gl/react-google-maps"
import { useQuery } from "@tanstack/react-query"
import { X } from "lucide-react"
import { Button } from "@umnburrow/core"
import { useNavigate } from "react-router"
import { capitalizeFirstLetter, formatDateTime } from "@api/util.ts"
import type { BurrowLocation } from "@features/burrows/burrows.types.tsx"
import { getMap } from "@features/burrows/burrows.api.ts"

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
            <div className="bg-background border-border border-b p-4">
                <h1 className="text-text text-2xl font-bold">Burrow Map</h1>
                <p className="text-text/60 text-sm">
                    Find active Burrows around the University of Minnesota
                    campus
                </p>
            </div>

            {/* map contianer */}
            <div className="relative flex-1">
                {isLoading && (
                    <div className="bg-background/80 absolute inset-0 z-10 flex items-center justify-center">
                        <div className="text-text">Loading Burrows...</div>
                    </div>
                )}

                <GMap
                    defaultCenter={UMN_CENTER}
                    defaultZoom={15}
                    mapId="burrow-map"
                    disableDefaultUI={false}
                    className="h-full w-full"
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
                            <img
                                src="/image/standing_gopher.png"
                                alt="Burrow Indicator"
                                className="h-10 w-10 cursor-pointer transition-transform hover:scale-110"
                            />
                        </AdvancedMarker>
                    ))}
                </GMap>

                {/* burrow info */}
                {selectedBurrow && (
                    <div className="bg-background border-border absolute right-4 bottom-4 left-4 max-w-md rounded-lg border p-4 shadow-lg md:right-auto">
                        <div className="flex w-full items-start justify-between">
                            <div className="flex flex-row items-center gap-2">
                                <h3 className="text-text text-lg font-semibold">
                                    {selectedBurrow.burrow.title}
                                </h3>

                                <p className="text-text/60 text-sm">
                                    {formatDateTime(
                                        selectedBurrow.burrow.beginningTime,
                                        selectedBurrow.burrow.endTime
                                    )}
                                </p>
                            </div>

                            <button
                                onClick={() => setSelectedBurrow(null)}
                                className="text-text/60 hover:text-text cursor-pointer"
                            >
                                <X />
                            </button>
                        </div>

                        <span className="text-text/60 text-xs ">
                            {capitalizeFirstLetter(
                                selectedBurrow.burrow.kind.toLowerCase()
                            )}
                        </span>

                        <p className="text-text/80 mb-2 text-sm">
                            {selectedBurrow.burrow.location}
                        </p>

                        <p className="text-text/60 mb-3 text-sm">
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
