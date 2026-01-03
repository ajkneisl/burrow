import { Stack } from "expo-router"
import { useThemeColors } from "@api/theme/useThemeColors"

/**
 * Layout for authorization pages.
 *
 * @author AJ Kneisl
 */
export default function AuthLayout() {
    const colors = useThemeColors()

    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: {
                    backgroundColor: colors.background
                }
            }}
        >
            <Stack.Screen name="welcome" />
        </Stack>
    )
}
