import "@api/api.config"
import { getTheme } from "@umnburrow/core/api"
import "./global.css"
import { useEffect, useMemo } from "react"
import { Stack, useRouter, useSegments } from "expo-router"
import { Provider, useAtom } from "jotai"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import Toast from "react-native-toast-message"
import { useFonts } from "expo-font"
import * as SplashScreen from "expo-splash-screen"
import { useColorScheme } from "nativewind"
import { Appearance, View } from "react-native"
import { store } from "@api/api.atom"
import { authToken } from "@features/auth/auth.atom"
import { themeAtom } from "@api/theme/theme.atom"

import { themeVars } from "@api/theme/theme.types"
import { ErrorBoundary } from "@components/errors/ErrorBoundary"
import { OfflineIndicator } from "@components/errors/OfflineIndicator"
import useUser from "@features/auth/hooks/useUser"

SplashScreen.preventAutoHideAsync().catch(() => {})

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            enabled: () => store.get(authToken) !== "",
            retry: 1,
            staleTime: 1000 * 60 * 5 // 5 minutes
        }
    }
})

/**
 * Redirects to the login screen when the auth token is cleared
 * while the user is on a protected route.
 */
function AuthGuard() {
    const [auth] = useAtom(authToken)
    const segments = useSegments()
    const router = useRouter()

    useEffect(() => {
        const inAuthGroup = segments[0] === "(auth)"

        if ((!auth || auth === "") && !inAuthGroup) {
            queryClient.clear()
            router.replace("/(auth)/welcome")
        }
    }, [auth, segments, router])

    return null
}

/**
 * Theme manager that loads and applies the user's theme.
 * Must be inside the Jotai Provider to access theme state.
 */
function ThemeManager({ children }: { children: React.ReactNode }) {
    const user = useUser()
    const [theme, setTheme] = useAtom(themeAtom)
    const { setColorScheme, colorScheme } = useColorScheme()

    // Fetch theme from backend and update local storage if different
    useEffect(() => {
        async function loadTheme() {
            const loadedTheme = await getTheme()

            console.log("loaded: ", loadedTheme)

            if (theme !== loadedTheme) {
                await setTheme(loadedTheme)
            }
        }

        // If signed in, load the theme
        if (user) {
            void loadTheme()
        }
    }, [user, setTheme])

    // Compute actual color scheme based on theme setting
    const computedScheme = useMemo(() => {
        if (theme === "AUTO") {
            const systemScheme = Appearance.getColorScheme()
            return systemScheme === "dark" ? "dark" : "light"
        }

        // Map theme to color scheme
        if (theme === "DARK" || theme === "EARTH") {
            return "dark"
        }

        return "light"
    }, [theme])

    // Apply the computed color scheme
    useEffect(() => {
        setColorScheme(computedScheme)
    }, [computedScheme, setColorScheme])

    // Apply theme variables based on color scheme
    const themeStyle = themeVars[colorScheme || "light"]

    return <View style={[{ flex: 1 }, themeStyle]}>{children}</View>
}

export default function RootLayout() {
    const [fontsLoaded] = useFonts({
        "Inter-Regular": require("../assets/fonts/Inter-Regular.ttf"),
        "Inter-Medium": require("../assets/fonts/Inter-Medium.ttf"),
        "Inter-SemiBold": require("../assets/fonts/Inter-SemiBold.ttf"),
        "Inter-Bold": require("../assets/fonts/Inter-Bold.ttf"),
        "Inter-ExtraBold": require("../assets/fonts/Inter-ExtraBold.ttf"),
        "Figtree-Bold": require("../assets/fonts/Figtree-Bold.ttf"),
        "Figtree-ExtraBold": require("../assets/fonts/Figtree-ExtraBold.ttf")
    })

    useEffect(() => {
        if (fontsLoaded) {
            SplashScreen.hideAsync().catch((err) => {
                console.log(err)
            })
        }
    }, [fontsLoaded])

    if (!fontsLoaded) {
        return null
    }

    return (
        <ErrorBoundary>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <SafeAreaProvider>
                    <Provider store={store}>
                        <QueryClientProvider client={queryClient}>
                            <AuthGuard />
                            <ThemeManager>
                                <OfflineIndicator />

                                <Stack
                                    screenOptions={{
                                        headerShown: false
                                    }}
                                >
                                    <Stack.Screen name="index" />
                                </Stack>

                                <Toast />
                            </ThemeManager>
                        </QueryClientProvider>
                    </Provider>
                </SafeAreaProvider>
            </GestureHandlerRootView>
        </ErrorBoundary>
    )
}
