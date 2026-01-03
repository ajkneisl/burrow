import { useState, useEffect, useMemo } from "react"
import {
    View,
    Text,
    TextInput,
    SectionList,
    Pressable,
    ActivityIndicator
} from "react-native"
import { useAtom } from "jotai"
import { useRouter } from "expo-router"
import { useQuery } from "@tanstack/react-query"
import { Modal } from "@components/core"
import { searchModalOpen } from "../layout.atom"
import { Search, X, Users, MapPin } from "lucide-react-native"
import { useThemeColors } from "@api/theme/useThemeColors"
import { themeColors } from "@api/theme/theme.types"
import {
    search,
    isUserResult,
    isBurrowResult,
    type SearchResult
} from "../search/search.api"

export function SearchModal() {
    const [isOpen, setIsOpen] = useAtom(searchModalOpen)
    const [query, setQuery] = useState("")
    const router = useRouter()
    const colors = useThemeColors()

    const handleClose = () => {
        setIsOpen(false)
        setQuery("")
    }

    // Search query with debouncing
    const { data, isLoading } = useQuery({
        queryKey: ["search", query],
        queryFn: async () => await search(query, 1),
        enabled: query.length >= 2,
        staleTime: 1000 * 60 // 1 minute
    })

    const results = useMemo(() => data?.contents ?? [], [data])

    // Group results by type
    const sections = useMemo(() => {
        const burrows = results.filter(isBurrowResult)
        const users = results.filter(isUserResult)

        const sectionsArray = []
        if (burrows.length > 0) {
            sectionsArray.push({ title: "Burrows", data: burrows })
        }
        if (users.length > 0) {
            sectionsArray.push({ title: "Users", data: users })
        }
        return sectionsArray
    }, [results])

    const handleResultPress = (item: SearchResult) => {
        handleClose()
        if (isBurrowResult(item)) {
            router.push(`/burrow/${item.burrow.id}`)
        } else if (isUserResult(item)) {
            router.push(`/user/${item.username}`)
        }
    }

    return (
        <Modal
            visible={isOpen}
            onClose={handleClose}
            size="full"
            scrollable={false}
        >
            {/* Search Input */}
            <View className="mb-6">
                <View className="flex-row items-center gap-3">
                    <View className="flex-1 flex-row items-center bg-card dark:bg-card rounded-lg px-4 py-3">
                        <Search size={20} color={colors.text} style={{ opacity: 0.6 }} />
                        <TextInput
                            value={query}
                            onChangeText={setQuery}
                            placeholder="Search Burrows, users, or topics..."
                            placeholderTextColor="#9CA3AF"
                            className="flex-1 ml-3 text-base text-text"
                            autoFocus
                        />
                        {query.length > 0 && (
                            <Pressable onPress={() => setQuery("")}>
                                <X size={20} color={colors.text} style={{ opacity: 0.6 }} />
                            </Pressable>
                        )}
                    </View>
                    <Pressable
                        onPress={handleClose}
                        className="py-3 px-2 min-h-[44px] items-center justify-center"
                        accessibilityRole="button"
                        accessibilityLabel="Close search"
                    >
                        <Text className="text-primary text-base font-semibold">Cancel</Text>
                    </Pressable>
                </View>
            </View>

            {/* Results */}
            {query.length === 0 ? (
                <EmptyState colors={colors} />
            ) : query.length < 2 ? (
                <View className="flex-1 items-center justify-center py-12">
                    <Text className="text-text text-opacity-60">
                        Type at least 2 characters to search
                    </Text>
                </View>
            ) : isLoading ? (
                <View className="flex-1 items-center justify-center py-12">
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text className="text-text text-opacity-60 mt-4">Searching...</Text>
                </View>
            ) : sections.length === 0 ? (
                <NoResults query={query} />
            ) : (
                <SectionList
                    sections={sections}
                    keyExtractor={(item) =>
                        isBurrowResult(item) ? item.burrow.id : item.userID
                    }
                    renderItem={({ item }) => (
                        <SearchResultItem
                            item={item}
                            onPress={() => handleResultPress(item)}
                            colors={colors}
                        />
                    )}
                    renderSectionHeader={({ section }) => (
                        <View className="bg-background py-2">
                            <Text className="text-sm font-semibold text-text text-opacity-60 uppercase">
                                {section.title}
                            </Text>
                        </View>
                    )}
                    ItemSeparatorComponent={() => <View className="h-2" />}
                    stickySectionHeadersEnabled={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            )}
        </Modal>
    )
}

function EmptyState({ colors }: { colors: typeof themeColors.light }) {
    return (
        <View className="flex-1 items-center justify-center py-12">
            <Search size={48} color={colors.text} style={{ opacity: 0.2 }} />
            <Text className="text-text text-opacity-60 text-lg mt-4">
                Search for Burrows, users, or topics
            </Text>
            <Text className="text-text text-opacity-40 text-sm mt-2 text-center px-6">
                Find study groups, events, clubs, and connect with other Gophers
            </Text>
        </View>
    )
}

function NoResults({ query }: { query: string }) {
    return (
        <View className="flex-1 items-center justify-center py-12">
            <Text className="text-text text-opacity-60 text-lg">
                No results for "{query}"
            </Text>
            <Text className="text-text text-opacity-40 text-sm mt-2">
                Try searching for something else
            </Text>
        </View>
    )
}

function SearchResultItem({
    item,
    onPress,
    colors
}: {
    item: SearchResult
    onPress: () => void
    colors: typeof themeColors.light
}) {
    if (isBurrowResult(item)) {
        return (
            <Pressable
                onPress={onPress}
                className="bg-card border border-card-border rounded-lg p-4 flex-row items-center gap-3 active:opacity-70"
            >
                <View className="bg-primary/10 rounded-full w-12 h-12 items-center justify-center">
                    <MapPin size={20} color={colors.primary} />
                </View>
                <View className="flex-1">
                    <Text className="text-text font-semibold" numberOfLines={1}>
                        {item.burrow.title}
                    </Text>
                    <Text className="text-text text-opacity-60 text-sm" numberOfLines={1}>
                        {item.burrow.kind} • by @{item.ownerUsername}
                    </Text>
                </View>
            </Pressable>
        )
    }

    if (isUserResult(item)) {
        return (
            <Pressable
                onPress={onPress}
                className="bg-card border border-card-border rounded-lg p-4 flex-row items-center gap-3 active:opacity-70"
            >
                <View className="bg-primary rounded-full w-12 h-12 items-center justify-center">
                    <Text className="text-white font-bold text-lg">
                        {item.username[0]?.toUpperCase() || "?"}
                    </Text>
                </View>
                <View className="flex-1">
                    <Text className="text-text font-semibold" numberOfLines={1}>
                        {item.profile.firstName && item.profile.lastName
                            ? `${item.profile.firstName} ${item.profile.lastName}`
                            : item.username}
                    </Text>
                    <Text className="text-text text-opacity-60 text-sm" numberOfLines={1}>
                        @{item.username}
                        {item.profile.major && ` • ${item.profile.major}`}
                    </Text>
                </View>
            </Pressable>
        )
    }

    return null
}
