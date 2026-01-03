import { Redirect } from "expo-router"
import { useAtom } from "jotai"
import { authToken } from "@features/auth/auth.atom"

/**
 * Root redirect based on authentication state
 */
export default function Index() {
    const [auth] = useAtom(authToken)

    // Redirect based on auth state
    if (auth && auth !== "") {
        return <Redirect href="/(tabs)" />
    }

    return <Redirect href="/(auth)/welcome" />
}
