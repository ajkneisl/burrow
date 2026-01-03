import { useEffect, useState } from "react"
import * as WebBrowser from "expo-web-browser"
import * as Google from "expo-auth-session/providers/google"
import { useRouter } from "expo-router"
import { useAtom } from "jotai"
import { authToken, newUser as newUserAtom, userDetails } from "../auth.atom"
import { login } from "../user.api"
import { makeRedirectUri } from "expo-auth-session"

// Required for Google Auth to work properly
WebBrowser.maybeCompleteAuthSession()

/**
 * Google OAuth hook for React Native
 *
 * Configuration:
 * - Get OAuth client IDs from Google Cloud Console
 * - Add redirect URIs for your app scheme (e.g., burrow://redirect)
 */
export function useGoogleAuth() {
    const [, setAuth] = useAtom(authToken)
    const [, setUser] = useAtom(userDetails)
    const [, setNewUser] = useAtom(newUserAtom)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const [request, response, promptAsync] = Google.useAuthRequest({
        iosClientId:
            "808386876282-51cc5ue6pkbplbhtbugko3hhhometbq4.apps.googleusercontent.com",
        androidClientId: "YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com",
        webClientId: "YOUR_WEB_CLIENT_ID.apps.googleusercontent.com",
        scopes: ["profile", "email"],
        redirectUri: makeRedirectUri({
            projectNameForProxy: `@username/burrow`
        })
    })

    useEffect(() => {
        if (response?.type === "success") {
            const { authentication } = response
            if (authentication?.idToken) {
                handleGoogleSignIn(authentication.idToken)
            }
        } else if (response?.type === "error") {
            setError("Google sign-in failed. Please try again.")
            setLoading(false)
        }
    }, [response])

    const handleGoogleSignIn = async (idToken: string) => {
        try {
            setLoading(true)
            setError(null)

            // Send ID token to backend for verification and user creation
            const data = await login(idToken)

            // Store auth token
            await setAuth(data.token)

            // Store user details
            setUser(data.user)
            setNewUser(data.newUser)

            // Navigate to main app or onboarding
            if (data.newUser) {
                // TODO: Navigate to onboarding flow
                router.replace("/(tabs)")
            } else {
                router.replace("/(tabs)")
            }

            setLoading(false)
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Login failed. Please try again."
            )
            setLoading(false)
        }
    }

    const signIn = async () => {
        setLoading(true)
        setError(null)

        try {
            await promptAsync()
        } catch (err) {
            setError("Failed to open Google sign-in. Please try again.")
            setLoading(false)
        }
    }

    const signOut = async () => {
        await setAuth("")
        setUser(null)
        setNewUser(false)
        router.replace("/(auth)/welcome")
    }

    return {
        signIn,
        signOut,
        loading,
        error,
        isReady: request !== null
    }
}
