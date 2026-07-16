import { View, ScrollView, RefreshControl } from "react-native"
import { useState, useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import ClubDetails from "@features/clubs/view/ClubDetails"
import ClubJoin from "@features/clubs/view/ClubJoin"
import { useClubContext } from "./_layout"

export default function InfoTab() {
    const { data, name, colors } = useClubContext()
    const queryClient = useQueryClient()
    const [refreshing, setRefreshing] = useState(false)

    const handleRefresh = useCallback(async () => {
        setRefreshing(true)
        await queryClient.invalidateQueries({ queryKey: ["club", name] })
        setRefreshing(false)
    }, [name, queryClient])

    return (
        <View className="flex-1 bg-background">
            <ScrollView
                className="flex-1"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.primary}
                    />
                }
                contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 100 }}
            >
                <ClubDetails clubResponse={data} />
            </ScrollView>

            <ClubJoin clubResponse={data} />
        </View>
    )
}
