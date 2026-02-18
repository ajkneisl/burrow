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
import { Search, X } from "lucide-react-native"
import { useThemeColors } from "@api/theme/useThemeColors"
import {
    search,
    isUserResult,
    isBurrowResult,
    isClubResult,
    type SearchResult
} from "./search.api"
import { SearchEmptyState } from "./SearchEmptyState"
import { SearchNoResults } from "./SearchNoResults"
import { SearchResultItem } from "./SearchResultItem"

type SearchSection = { title: string; data: SearchResult[] }

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

    const sections = useMemo((): SearchSection[] => {
        const burrows = results.filter(isBurrowResult)
        const users = results.filter(isUserResult)
        const clubs = results.filter(isClubResult)

        const sectionsArray: SearchSection[] = []
        if (clubs.length > 0) {
            sectionsArray.push({ title: "Clubs", data: clubs })
        }
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
        } else if (isClubResult(item)) {
            router.push(`/club/${item.name}`)
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
            <View className="mt-20 px-4 pt-2 pb-4">
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
                            <Pressable onPress={() => setQuery("")} hitSlop={8}>
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
                <SearchEmptyState />
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
                <SearchNoResults query={query} />
            ) : (
                <SectionList<SearchResult, SearchSection>
                    sections={sections}
                    keyExtractor={(item) =>
                        isBurrowResult(item) ? item.burrow.id : isClubResult(item) ? item.clubID : item.userID
                    }
                    renderItem={({ item }) => (
                        <SearchResultItem
                            item={item}
                            onPress={() => handleResultPress(item)}
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