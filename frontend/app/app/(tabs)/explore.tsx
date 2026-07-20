import { Pressable, Text as RNText } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useState } from "react"
import { Header } from "@features/layout/components"
import { ExploreBurrows } from "@features/explore/components/ExploreBurrows"
import { ExploreClubs } from "@features/explore/components/ExploreClubs"
import { useThemeColors } from "@api/theme/useThemeColors"

type ExploreMode = "burrows" | "clubs"

/**
 * Explore screen — browse Burrows and discover Clubs in one place.
 * The header title doubles as the mode switch.
 *
 * @author AJ Kneisl
 */
export default function ExploreScreen() {
    const colors = useThemeColors()
    const [mode, setMode] = useState<ExploreMode>("burrows")

    return (
        <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
            <Header
                title="Explore"
                titleContent={
                    <>
                        <TitleTab
                            label="Burrows"
                            active={mode === "burrows"}
                            onPress={() => setMode("burrows")}
                            color={colors.text}
                        />
                        <TitleTab
                            label="Clubs"
                            active={mode === "clubs"}
                            onPress={() => setMode("clubs")}
                            color={colors.text}
                        />
                    </>
                }
            />

            {mode === "burrows" ? <ExploreBurrows /> : <ExploreClubs />}
        </SafeAreaView>
    )
}

/** A header-sized title that doubles as a mode tab. */
function TitleTab({
    label,
    active,
    onPress,
    color
}: {
    label: string
    active: boolean
    onPress: () => void
    color: string
}) {
    return (
        <Pressable onPress={onPress} hitSlop={8}>
            <RNText
                style={{
                    fontFamily: "Figtree-ExtraBold",
                    fontSize: 24,
                    color,
                    opacity: active ? 1 : 0.3
                }}
            >
                {label}
            </RNText>
        </Pressable>
    )
}
