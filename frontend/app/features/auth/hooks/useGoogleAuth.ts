import { useCallback, useEffect, useState } from "react"
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
        scopes: ["profile", "email"],
        redirectUri: makeRedirectUri({
            scheme: "com.googleusercontent.apps.808386876282-51cc5ue6pkbplbhtbugko3hhhometbq4"
        })
    })

    const handleGoogleSignIn = useCallback(
        async (idToken: string) => {
            try {
                setLoading(true)
                setError(null)

                const data = await login(idToken)

                await setAuth(data.token)
                setUser(data.user)
                setNewUser(data.newUser)

                router.replace("/(tabs)")
                setLoading(false)
            } catch (e) {
                setError(
                    e instanceof Error
                        ? e.message
                        : "Login failed. Please try again."
                )
                setLoading(false)
            }
        },
        [setAuth, setUser, setNewUser, router]
    )

    useEffect(() => {
        if (response?.type === "success") {
            // idToken can be in authentication object or in params
            const idToken =
                response.authentication?.idToken ??
                (response.params as { id_token?: string })?.id_token

            if (idToken) {
                void handleGoogleSignIn(idToken)
            } else {
                setError("No ID token received from Google.")
                setLoading(false)
            }
        } else if (response?.type === "error") {
            setError("Google sign-in failed. Please try again.")
            setLoading(false)
        }
    }, [response, handleGoogleSignIn])

    const signIn = async () => {
        setLoading(true)
        setError(null)

        try {
            await promptAsync()
        } catch {
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
