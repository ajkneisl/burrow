import { getUser } from "@umnburrow/core/api"
import type { Profile } from "@umnburrow/core/api"
import { useAtom } from "jotai"
import { authToken } from "@features/auth/auth.atom"
import { useRouter } from "expo-router"
import { useQuery } from "@tanstack/react-query"

export default function useProfile(): Profile | null {
    const [auth] = useAtom(authToken)
    const router = useRouter()

    const { data, error, isLoading } = useQuery({
        queryKey: ["user"],
        queryFn: async () => await getUser()
    })

    // the user is not logged in
    if (!auth || auth === "" || !data) {
        return null
    }

    return data.profile
}
