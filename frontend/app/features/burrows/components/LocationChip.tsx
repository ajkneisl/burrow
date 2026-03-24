import {Chip } from "@components/core"
import { MapPin } from "lucide-react-native"
import {useMemo} from "react";

/**
 * {@link LocationChip}
 */
type LocationChipProps = {
    location: string
}

/**
 * The stylized locatioj chip.
 *
 * @param location The Burrow's location..
 *
 * @author AJ Kneisl
 */
export default function LocationChip({ location }: LocationChipProps) {
    const shortenedLocation = useMemo(() => {
        let initialLocation = location

        if (location.includes(",")) {
            initialLocation = initialLocation.split(",")[0]
        }

        return initialLocation.substring(0, 16)
    }, [location])

    return (
        <Chip color="secondary" icon={MapPin}>
            {shortenedLocation}
        </Chip>
    )
}
