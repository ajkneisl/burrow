import { View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useState } from "react"
import { Header } from "@features/layout/components"
import { FilterChip } from "@components/core"
import AllRelationsTab from "@features/relations/components/AllRelationsTab"
import FriendsTab from "@features/relations/components/FriendsTab"
import FollowingTab from "@features/relations/components/FollowingTab"
import FollowersTab from "@features/relations/components/FollowersTab"
import DiscoverTab from "@features/relations/components/DiscoverTab"

type TabType = "friends" | "following" | "followers" | "discover"

/**
 * Friends screen — shows all connections by default; chips narrow to a
 * single relation. Tapping the active chip returns to the full list.
 *
 * @author AJ Kneisl
 */
export default function FriendsScreen() {
    const [activeTab, setActiveTab] = useState<TabType | null>(null)

    const toggleTab = (tab: TabType) =>
        setActiveTab((prev) => (prev === tab ? null : tab))

    return (
        <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
            <Header title="Friends" />

            <View className="px-6 py-3 border-b border-card-border">
                <View className="flex-row gap-2">
                    <FilterChip
                        label="Friends"
                        active={activeTab === "friends"}
                        onPress={() => toggleTab("friends")}
                    />
                    <FilterChip
                        label="Following"
                        active={activeTab === "following"}
                        onPress={() => toggleTab("following")}
                    />
                    <FilterChip
                        label="Followers"
                        active={activeTab === "followers"}
                        onPress={() => toggleTab("followers")}
                    />
                    <FilterChip
                        label="Discover"
                        active={activeTab === "discover"}
                        onPress={() => toggleTab("discover")}
                    />
                </View>
            </View>

            {activeTab === null && <AllRelationsTab />}
            {activeTab === "friends" && <FriendsTab />}
            {activeTab === "following" && <FollowingTab />}
            {activeTab === "followers" && <FollowersTab />}
            {activeTab === "discover" && <DiscoverTab />}
        </SafeAreaView>
    )
}
