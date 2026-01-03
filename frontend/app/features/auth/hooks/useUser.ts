import type { User } from "../user.types"
import { useAtom } from "jotai"
import { authToken } from "../auth.atom"
import { useQuery } from "@tanstack/react-query"
import { getUser } from "@features/auth/user.api"
import { useRouter } from "expo-router"
import { useEffect } from "react"

/**
 * Retrieve the `User` object.
 */
export default function useUser(): User | null {
    const [auth, setAuth] = useAtom(authToken)
    const router = useRouter()

    const { data, error, isLoading } = useQuery({
        queryKey: ["user"],
        queryFn: async () => await getUser()
    })

    // if the request fails, log the user out
    useEffect(() => {
        if (error && !isLoading) {
            router.replace("/(auth)/welcome")
        }
    }, [auth, error, isLoading, router])

    // the user is not logged in
    if (!auth || auth === "" || !data) {
        return null
    }

    return data.user
}
