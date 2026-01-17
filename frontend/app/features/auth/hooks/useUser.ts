import type { User } from "../user.types"
import { useAtom } from "jotai"
import { authToken } from "../auth.atom"
import { useQuery } from "@tanstack/react-query"
import { getUser } from "@features/auth/user.api"
import { useRouter } from "expo-router"
import { useEffect } from "react"
import { useRoute } from "@react-navigation/core"

/**
 * Retrieve the `User` object.
 */
export default function useUser(): User | null {
    const [auth] = useAtom(authToken)
    const router = useRouter()
    const route = useRoute()

    const { data, error, isLoading } = useQuery({
        queryKey: ["user"],
        queryFn: async () => await getUser()
    })

    // if the request fails, log the user out
    useEffect(() => {
        if (error && !isLoading && route.name !== "__root") {
            router.replace("/(auth)/welcome")
        }
    }, [auth, error, isLoading, router, route])

    // the user is not logged in
    if (!auth || auth === "" || !data) {
        return null
    }

    return data.user
}
