import { View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useState } from "react"
import { Header } from "@features/layout/components"
import { FilterChip } from "@components/core"
import FriendsTab from "@features/relations/components/FriendsTab"
import FollowingTab from "@features/relations/components/FollowingTab"
import FollowersTab from "@features/relations/components/FollowersTab"
import DiscoverTab from "@features/relations/components/DiscoverTab"

type TabType = "friends" | "following" | "followers" | "discover"

/**
 * Friends screen
 *
 * @author AJ Kneisl
 */
export default function FriendsScreen() {
    const [activeTab, setActiveTab] = useState<TabType>("friends")

    return (
        <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
            <Header title="Friends" />

            <View className="px-6 py-3 border-b border-card-border">
                <View className="flex-row gap-2">
                    <FilterChip
                        label="Friends"
                        active={activeTab === "friends"}
                        onPress={() => setActiveTab("friends")}
                    />
                    <FilterChip
                        label="Following"
                        active={activeTab === "following"}
                        onPress={() => setActiveTab("following")}
                    />
                    <FilterChip
                        label="Followers"
                        active={activeTab === "followers"}
                        onPress={() => setActiveTab("followers")}
                    />
                    <FilterChip
                        label="Discover"
                        active={activeTab === "discover"}
                        onPress={() => setActiveTab("discover")}
                    />
                </View>
            </View>

            {activeTab === "friends" && <FriendsTab />}
            {activeTab === "following" && <FollowingTab />}
            {activeTab === "followers" && <FollowersTab />}
            {activeTab === "discover" && <DiscoverTab />}
        </SafeAreaView>
    )
}
