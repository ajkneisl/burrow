import { View, ScrollView, RefreshControl } from "react-native"
import { useState, useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import ClubMembers from "@features/clubs/view/ClubMembers"
import { useClubContext } from "./_layout"

export default function MembersTab() {
    const { data, name, colors } = useClubContext()
    const queryClient = useQueryClient()
    const [refreshing, setRefreshing] = useState(false)

    const handleRefresh = useCallback(async () => {
        setRefreshing(true)
        await queryClient.invalidateQueries({ queryKey: ["clubMembers", name] })
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
            contentContainerStyle={{ padding: 16, gap: 20 }}
        >
            <ClubMembers clubResponse={data} />
            <View className="h-12" />
        </ScrollView>
    )
}
