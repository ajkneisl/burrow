import { getArticles } from "@umnburrow/core/api"
import { useCallback, useMemo, useState } from "react"
import {
    View,
    ScrollView,
    Pressable,
    RefreshControl,
    ActivityIndicator
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter, Stack } from "expo-router"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, BookOpen, Search } from "lucide-react-native"
import { useThemeColors } from "@api/theme/useThemeColors"
import { Input, Text, ViewErrors } from "@components/core"

import ArticleCard from "@features/articles/components/ArticleCard"

/**
 * Browse and search all published articles.
 *
 * @author AJ Kneisl
 */
export default function ArticlesScreen() {
    const router = useRouter()
    const colors = useThemeColors()
    const [query, setQuery] = useState("")
    const [refreshing, setRefreshing] = useState(false)

    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ["articles"],
        queryFn: getArticles,
        refetchOnWindowFocus: false
    })

    const onRefresh = useCallback(async () => {
        setRefreshing(true)
        await refetch()
        setRefreshing(false)
    }, [refetch])

    const filtered = useMemo(() => {
        const search = query.trim().toLowerCase()

        if (!search) return data ?? []

        return (data ?? []).filter(
            (article) =>
                article.title.toLowerCase().includes(search) ||
                article.description?.toLowerCase().includes(search)
        )
    }, [data, query])

    return (
        <SafeAreaView className="flex-1 bg-background">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="px-6 py-4 border-b border-card-border flex-row items-center">
                <Pressable
                    onPress={() => router.back()}
                    className="p-2 mr-2 -ml-2"
                >
                    <ArrowLeft size={24} color={colors.text} />
                </Pressable>

                <View className="flex-row items-center gap-2">
                    <BookOpen size={22} color={colors.secondary} />

                    <Text className="text-2xl font-bold text-text">
                        Articles
                    </Text>
                </View>
            </View>

            <ScrollView
                className="flex-1 px-6 py-4"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.primary}
                    />
                }
            >
                <Text className="text-text text-opacity-70 mb-4">
                    Guides, updates, and stories from the Burrow team.
                </Text>

                {/* search */}
                <Input
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search articles…"
                    leftIcon={<Search size={18} color={colors.text} />}
                />

                {isError ? (
                    <ViewErrors error={`${error}`} />
                ) : isLoading ? (
                    <View className="items-center py-16">
                        <ActivityIndicator color={colors.primary} />
                    </View>
                ) : filtered.length === 0 ? (
                    <View className="border border-dashed border-card-border rounded-2xl p-12 items-center">
                        <Text className="text-text text-opacity-60 text-center">
                            {query.trim()
                                ? `No articles match "${query.trim()}".`
                                : "No articles have been published yet."}
                        </Text>
                    </View>
                ) : (
                    filtered.map((article) => (
                        <ArticleCard key={article.slug} article={article} />
                    ))
                )}

                {/* bottom spacer */}
                <View className="h-12" />
            </ScrollView>
        </SafeAreaView>
    )
}
