import type { Article } from "@umnburrow/core/api"
import { Pressable, View } from "react-native"
import { useRouter } from "expo-router"
import { ArrowRight } from "lucide-react-native"
import { Card, Text } from "@components/core"
import { useThemeColors } from "@api/theme/useThemeColors"

/**
 * A card previewing a single article, linking to its full page.
 *
 * @param article The article to preview.
 *
 * @author AJ Kneisl
 */
export default function ArticleCard({ article }: { article: Article }) {
    const router = useRouter()
    const colors = useThemeColors()

    const date = new Date(article.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric"
    })

    return (
        <Pressable onPress={() => router.push(`/article/${article.slug}`)}>
            <Card variant="bordered" className="mb-4">
                <Text className="text-text text-opacity-50 text-xs font-medium">
                    {date}
                </Text>

                <Text className="text-text text-xl font-bold mt-1">
                    {article.title}
                </Text>

                {article.description && (
                    <Text
                        className="text-text text-opacity-70 text-sm mt-2"
                        numberOfLines={3}
                    >
                        {article.description}
                    </Text>
                )}

                <View className="flex-row items-center gap-1 mt-4">
                    <Text className="text-secondary text-sm font-semibold">
                        Read
                    </Text>

                    <ArrowRight size={16} color={colors.secondary} />
                </View>
            </Card>
        </Pressable>
    )
}
