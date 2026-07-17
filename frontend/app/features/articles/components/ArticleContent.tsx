import { useMemo } from "react"
import { Linking, Platform } from "react-native"
import { useRouter } from "expo-router"
import Markdown from "react-native-markdown-display"
import { useThemeColors } from "@api/theme/useThemeColors"

const MONO_FONT = Platform.select({ ios: "Menlo", default: "monospace" })

/**
 * Renders an article's markdown content with Burrow styling.
 *
 * @param content The markdown content to render.
 *
 * @author AJ Kneisl
 */
export default function ArticleContent({ content }: { content: string }) {
    const colors = useThemeColors()
    const router = useRouter()

    const styles = useMemo(
        () => ({
            body: {
                color: colors.text,
                fontFamily: "Inter-Medium",
                fontSize: 16,
                lineHeight: 24
            },
            heading1: {
                color: colors.text,
                fontFamily: "Inter-Bold",
                fontSize: 30,
                lineHeight: 36,
                marginTop: 24,
                marginBottom: 12
            },
            heading2: {
                color: colors.text,
                fontFamily: "Inter-Bold",
                fontSize: 24,
                lineHeight: 30,
                marginTop: 20,
                marginBottom: 10
            },
            heading3: {
                color: colors.text,
                fontFamily: "Inter-SemiBold",
                fontSize: 20,
                lineHeight: 26,
                marginTop: 16,
                marginBottom: 8
            },
            heading4: {
                color: colors.text,
                fontFamily: "Inter-SemiBold",
                fontSize: 18,
                lineHeight: 24,
                marginTop: 12,
                marginBottom: 8
            },
            paragraph: {
                color: colors.text,
                marginTop: 0,
                marginBottom: 16,
                lineHeight: 24
            },
            link: {
                color: colors.secondary,
                fontFamily: "Inter-SemiBold"
            },
            strong: {
                color: colors.text,
                fontFamily: "Inter-SemiBold"
            },
            blockquote: {
                backgroundColor: "transparent",
                borderColor: colors.secondary,
                borderLeftWidth: 4,
                paddingLeft: 16,
                marginBottom: 16
            },
            bullet_list: { marginBottom: 16 },
            ordered_list: { marginBottom: 16 },
            list_item: { marginBottom: 4 },
            code_inline: {
                color: colors.text,
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
                borderWidth: 1,
                borderRadius: 4,
                paddingHorizontal: 4,
                fontFamily: MONO_FONT,
                fontSize: 14
            },
            code_block: {
                color: colors.text,
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
                borderWidth: 1,
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
                fontFamily: MONO_FONT,
                fontSize: 14
            },
            fence: {
                color: colors.text,
                backgroundColor: colors.card,
                borderColor: colors.cardBorder,
                borderWidth: 1,
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
                fontFamily: MONO_FONT,
                fontSize: 14
            },
            hr: {
                backgroundColor: colors.cardBorder,
                height: 1,
                marginVertical: 32
            },
            table: {
                borderColor: colors.cardBorder,
                borderWidth: 1,
                borderRadius: 8,
                marginBottom: 16
            },
            th: {
                padding: 8
            },
            td: {
                padding: 8
            },
            image: {
                borderRadius: 12,
                marginBottom: 16
            }
        }),
        [colors]
    )

    return (
        <Markdown
            style={styles}
            onLinkPress={(url) => {
                // keep internal links inside the app
                if (url.startsWith("/")) {
                    router.push(url as never)
                    return false
                }

                Linking.openURL(url)
                return false
            }}
        >
            {content}
        </Markdown>
    )
}
