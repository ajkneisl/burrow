import { StyleSheet, useColorScheme } from "react-native"
import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs"
import { GlassSurface, glassAvailable } from "@components/core"
import { useThemeColors } from "@api/theme/useThemeColors"

/**
 * Shared bottom tab bar options — Liquid Glass floating over content on
 * iOS 26+, the classic solid themed bar elsewhere.
 *
 * Used by the main tab bar and the burrow / club sub-tab bars so they
 * all match. Screens under a glass bar scroll beneath it, so give list
 * content bottom padding (or use `useBottomTabBarHeight`).
 *
 * @author AJ Kneisl
 */
export function useGlassTabOptions(): BottomTabNavigationOptions {
    const colors = useThemeColors()
    const isDark = useColorScheme() === "dark"

    return {
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarStyle: glassAvailable
            ? {
                  // float over content so the glass has something to refract
                  position: "absolute",
                  backgroundColor: "transparent",
                  borderTopWidth: 0,
                  elevation: 0,
                  paddingHorizontal: 16,
                  paddingVertical: 2,
                  paddingTop: 10
              }
            : {
                  backgroundColor: colors.background,
                  borderTopColor: isDark ? "#333333" : colors.cardBorder,
                  borderTopWidth: 1,
                  paddingHorizontal: 16,
                  paddingVertical: 2,
                  paddingTop: 10
              },
        tabBarBackground: glassAvailable
            ? () => <GlassSurface style={StyleSheet.absoluteFill} />
            : undefined,
        tabBarItemStyle: {
            paddingVertical: 4
        }
    }
}
