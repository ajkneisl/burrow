import { View, ScrollView, RefreshControl } from "react-native"
import { useState, useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import ClubBurrows from "@features/clubs/view/ClubBurrows"
import { useClubContext } from "./_layout"

export default function MeetingsTab() {
    const { data, name, colors } = useClubContext()
    const queryClient = useQueryClient()
    const [refreshing, setRefreshing] = useState(false)

    const handleRefresh = useCallback(async () => {
        setRefreshing(true)
        await queryClient.invalidateQueries({ queryKey: ["clubBurrows", name] })
        setRefreshing(false)
    }, [name, queryClient])

    return (
        <ScrollView
            className="flex-1 bg-background"
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    tintColor={colors.primary}
                />
            }
            contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 100 }}
        >
            <ClubBurrows clubResponse={data} />
            <View className="h-12" />
        </ScrollView>
    )
}
