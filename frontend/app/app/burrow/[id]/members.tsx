import { View, ScrollView, RefreshControl } from "react-native"
import { useState, useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import Attendees from "@features/burrows/attendees/Attendees"
import { useBurrowContext } from "@features/burrows/context/burrows.context"
import { useThemeColors } from "@api/theme/useThemeColors"

export default function MembersTab() {
    const { data, id } = useBurrowContext()
    const colors = useThemeColors()
    const queryClient = useQueryClient()
    const [refreshing, setRefreshing] = useState(false)

    const handleRefresh = useCallback(async () => {
        setRefreshing(true)

        try {
            await queryClient.invalidateQueries({
                queryKey: ["attendees", id]
            })
        } finally {
            setRefreshing(false)
        }
    }, [queryClient, id])

    return (
        <ScrollView
            className="flex-1 bg-background"
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    tintColor={colors.primary}
                    colors={[colors.primary]}
                />
            }
        >
            <Attendees data={data} fullScreen />
        </ScrollView>
    )
}
