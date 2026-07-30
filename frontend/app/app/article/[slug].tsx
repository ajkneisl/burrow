import { getArticle } from "@umnburrow/core/api"
import { View, ScrollView, Pressable, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useLocalSearchParams, useRouter, Stack } from "expo-router"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft } from "lucide-react-native"
import { useThemeColors } from "@api/theme/useThemeColors"
import { Button, Text } from "@components/core"

import ArticleContent from "@features/articles/components/ArticleContent"

/**
 * Formats an article timestamp as a readable date.
 *
 * @param timestamp The timestamp in milliseconds.
 */
function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric"
    })
}

/**
 * Reads a single published article by its slug.
 *
 * @author AJ Kneisl
 */
export default function ArticleScreen() {
    const { slug } = useLocalSearchParams<{ slug: string }>()
    const router = useRouter()
    const colors = useThemeColors()

    const { data, isLoading, isError } = useQuery({
        queryKey: ["article", slug],
        queryFn: () => getArticle(slug!),
        enabled: !!slug,
        retry: false
    })

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

                <Text className="text-xl font-bold text-text" numberOfLines={1}>
                    {data?.title ?? "Article"}
                </Text>
            </View>

            {isLoading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator color={colors.primary} />
                </View>
            ) : isError || !data ? (
                <View className="flex-1 items-center justify-center px-6">
                    <Text className="text-text text-xl font-bold mb-2">
                        Article not found
                    </Text>

                    <Text className="text-text text-opacity-60 text-center mb-6">
                        This article doesn&apos;t exist or is no longer available.
                    </Text>

                    <Button onPress={() => router.back()}>Go back</Button>
                </View>
            ) : (
                <ScrollView className="flex-1 px-6 py-6">
                    {/* header */}
                    <Text className="text-3xl font-extrabold text-text mb-3">
                        {data.title}
                    </Text>

                    {data.description && (
                        <Text className="text-text text-opacity-70 text-lg mb-3">
                            {data.description}
                        </Text>
                    )}

                    <Text className="text-text text-opacity-50 text-sm mb-6">
                        {formatDate(data.createdAt)}
                        {data.updatedAt !== data.createdAt &&
                            ` · Updated ${formatDate(data.updatedAt)}`}
                    </Text>

                    <ArticleContent content={data.content} />

                    {/* bottom spacer */}
                    <View className="h-12" />
                </ScrollView>
            )}
        </SafeAreaView>
    )
}
