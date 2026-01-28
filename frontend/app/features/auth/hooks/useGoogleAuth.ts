import { useCallback, useEffect, useState } from "react"
import { useRouter } from "expo-router"
import { useAtom } from "jotai"
import {
    GoogleSignin,
    statusCodes,
    isSuccessResponse
} from "@react-native-google-signin/google-signin"
import { authToken, newUser as newUserAtom, userDetails } from "../auth.atom"
import { login } from "../user.api"

// OAuth client IDs
export const IOS_CLIENT_ID =
    "808386876282-51cc5ue6pkbplbhtbugko3hhhometbq4.apps.googleusercontent.com"
export const WEB_CLIENT_ID =
    "808386876282-4s7060hmt21b2i069tkea6fddsumj86o.apps.googleusercontent.com"

// Configure Google Sign-In
GoogleSignin.configure({
    iosClientId: IOS_CLIENT_ID,
    webClientId: WEB_CLIENT_ID,
    scopes: ["profile", "email"],
    offlineAccess: false
})

/**
 * Google OAuth hook for React Native
 */
export function useGoogleAuth() {
    const [, setAuth] = useAtom(authToken)
    const [, setUser] = useAtom(userDetails)
    const [, setNewUser] = useAtom(newUserAtom)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [isReady, setIsReady] = useState(false)
    const router = useRouter()

    useEffect(() => {
        // Google Sign-In is ready once configured
        setIsReady(true)
    }, [])

    const handleGoogleSignIn = useCallback(
        async (idToken: string) => {
            try {
                const data = await login(idToken)

                await setAuth(data.token)
                setUser(data.user)
                setNewUser(data.newUser)

                router.replace("/(tabs)")
            } catch (e: any) {
                setError(e ?? "Login failed. Please try again.")
            } finally {
                setLoading(false)
            }
        },
        [setAuth, setUser, setNewUser, router]
    )

    const signIn = async () => {
        setLoading(true)
        setError(null)

        try {
            await GoogleSignin.hasPlayServices()
            const response = await GoogleSignin.signIn()

            if (isSuccessResponse(response)) {
                const idToken = response.data.idToken

                if (idToken) {
                    await handleGoogleSignIn(idToken)
                } else {
                    setError("No ID token received from Google.")
                    setLoading(false)
                }
            } else {
                setError("Google sign-in was cancelled.")
                setLoading(false)
            }
        } catch (e) {
            setLoading(false)

            if (e instanceof Error && "code" in e) {
                const error = e as { code: string }
                if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                    // User cancelled - don't show error
                    return
                } else if (error.code === statusCodes.IN_PROGRESS) {
                    setError("Sign-in already in progress.")
                } else if (
                    error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE
                ) {
                    setError("Google Play Services not available.")
                } else {
                    setError("Google sign-in failed. Please try again.")
                }
            } else {
                setError("Google sign-in failed. Please try again.")
            }
        }
    }

    const signOut = async () => {
        try {
            await GoogleSignin.signOut()
        } catch {
            // Ignore sign out errors
        }
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
        isReady
    }
}
