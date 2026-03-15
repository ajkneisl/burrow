import { View } from "react-native"
import Attendees from "@features/burrows/attendees/Attendees"
import { useBurrowContext } from "@features/burrows/context/burrows.context"

export default function MembersTab() {
    const { data } = useBurrowContext()

    return (
        <View className="flex-1 bg-background">
            <Attendees data={data} fullScreen />
        </View>
    )
}
