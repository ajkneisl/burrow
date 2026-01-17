import { useState, useMemo } from "react"
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
import { Search, X, MapPin } from "lucide-react-native"
import { useThemeColors } from "@api/theme/useThemeColors"
import { themeColors } from "@api/theme/theme.types"
import { ProfilePicture } from "@components/profile/ProfilePicture"
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

    const { data, isLoading } = useQuery({
        queryKey: ["search", query],
        queryFn: async () => await search(query, 1),
        enabled: query.length >= 2,
        staleTime: 1000 * 60
    })

    const results = useMemo(() => data?.contents ?? [], [data])

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
            {/* Search Header */}
            <View className="px-4 pt-2 pb-4">
                <View className="flex-row items-center gap-3">
                    {/* Search Input */}
                    <View
                        className="flex-1 flex-row items-center rounded-xl px-4"
                        style={{
                            backgroundColor: colors.card,
                            height: 48
                        }}
                    >
                        <Search
                            size={20}
                            color={colors.text}
                            style={{ opacity: 0.5 }}
                        />
                        <TextInput
                            value={query}
                            onChangeText={setQuery}
                            placeholder="Search Burrows or users..."
                            placeholderTextColor={`${colors.text}80`}
                            autoFocus
                            style={{
                                flex: 1,
                                marginLeft: 12,
                                fontSize: 16,
                                color: colors.text,
                                height: 48
                            }}
                        />
                        {query.length > 0 && (
                            <Pressable
                                onPress={() => setQuery("")}
                                hitSlop={8}
                            >
                                <X
                                    size={18}
                                    color={colors.text}
                                    style={{ opacity: 0.5 }}
                                />
                            </Pressable>
                        )}
                    </View>

                    {/* Cancel Button */}
                    <Pressable
                        onPress={handleClose}
                        hitSlop={8}
                        className="active:opacity-70"
                    >
                        <Text
                            className="font-semibold"
                            style={{ color: colors.primary, fontSize: 16 }}
                        >
                            Cancel
                        </Text>
                    </Pressable>
                </View>
            </View>

            {/* Content */}
            {query.length === 0 ? (
                <EmptyState colors={colors} />
            ) : query.length < 2 ? (
                <View className="flex-1 items-center justify-center">
                    <Text style={{ color: `${colors.text}99`, fontSize: 15 }}>
                        Type at least 2 characters to search
                    </Text>
                </View>
            ) : isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text
                        style={{
                            color: `${colors.text}99`,
                            fontSize: 15,
                            marginTop: 16
                        }}
                    >
                        Searching...
                    </Text>
                </View>
            ) : sections.length === 0 ? (
                <NoResults query={query} colors={colors} />
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
                        <View
                            className="py-3"
                            style={{ backgroundColor: colors.background }}
                        >
                            <Text
                                className="text-xs font-bold uppercase tracking-wider"
                                style={{ color: `${colors.text}80` }}
                            >
                                {section.title}
                            </Text>
                        </View>
                    )}
                    ItemSeparatorComponent={() => <View className="h-3" />}
                    SectionSeparatorComponent={() => <View className="h-2" />}
                    stickySectionHeadersEnabled={false}
                    contentContainerStyle={{
                        paddingHorizontal: 16,
                        paddingBottom: 40
                    }}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </Modal>
    )
}

function EmptyState({ colors }: { colors: typeof themeColors.light }) {
    return (
        <View className="flex-1 items-center justify-center px-8">
            <View
                className="rounded-full p-5 mb-4"
                style={{ backgroundColor: `${colors.text}10` }}
            >
                <Search size={32} color={colors.text} style={{ opacity: 0.3 }} />
            </View>
            <Text
                className="text-center font-medium"
                style={{ color: `${colors.text}99`, fontSize: 17 }}
            >
                Search for Burrows or users
            </Text>
            <Text
                className="text-center mt-2"
                style={{ color: `${colors.text}60`, fontSize: 14 }}
            >
                Find study groups, events, and connect with Gophers
            </Text>
        </View>
    )
}

function NoResults({
    query,
    colors
}: {
    query: string
    colors: typeof themeColors.light
}) {
    return (
        <View className="flex-1 items-center justify-center px-8">
            <View
                className="rounded-full p-5 mb-4"
                style={{ backgroundColor: `${colors.text}10` }}
            >
                <Search size={32} color={colors.text} style={{ opacity: 0.3 }} />
            </View>
            <Text
                className="text-center font-medium"
                style={{ color: `${colors.text}99`, fontSize: 17 }}
            >
                No results for {`"${query}"`}
            </Text>
            <Text
                className="text-center mt-2"
                style={{ color: `${colors.text}60`, fontSize: 14 }}
            >
                Try a different search term
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
                className="flex-row items-center gap-3 p-4 rounded-2xl active:opacity-70"
                style={{
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: `${colors.text}10`
                }}
            >
                <View
                    className="rounded-full items-center justify-center"
                    style={{
                        width: 48,
                        height: 48,
                        backgroundColor: `${colors.primary}20`
                    }}
                >
                    <MapPin size={22} color={colors.primary} />
                </View>
                <View className="flex-1">
                    <Text
                        className="font-semibold"
                        style={{ color: colors.text, fontSize: 16 }}
                        numberOfLines={1}
                    >
                        {item.burrow.title}
                    </Text>
                    <Text
                        style={{ color: `${colors.text}80`, fontSize: 14, marginTop: 2 }}
                        numberOfLines={1}
                    >
                        {item.burrow.kind} &bull; by @{item.ownerUsername}
                    </Text>
                </View>
            </Pressable>
        )
    }

    if (isUserResult(item)) {
        const displayName = item.profile.name || item.username

        return (
            <Pressable
                onPress={onPress}
                className="flex-row items-center gap-3 p-4 rounded-2xl active:opacity-70"
                style={{
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: `${colors.text}10`
                }}
            >
                <ProfilePicture
                    name={displayName}
                    userID={item.userID}
                    size="md"
                />
                <View className="flex-1">
                    <Text
                        className="font-semibold"
                        style={{ color: colors.text, fontSize: 16 }}
                        numberOfLines={1}
                    >
                        {displayName}
                    </Text>
                    <Text
                        style={{ color: `${colors.text}80`, fontSize: 14, marginTop: 2 }}
                        numberOfLines={1}
                    >
                        @{item.username}
                        {item.profile.major && ` \u2022 ${item.profile.major}`}
                    </Text>
                </View>
            </Pressable>
        )
    }

    return null
}
