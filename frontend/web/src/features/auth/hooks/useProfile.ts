import { useAtom } from "jotai"
import { authToken } from "@features/auth/auth.atom.ts"
import { useNavigate } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { getUser } from "@features/auth/user.api.ts"
import type { Profile } from "@features/profile/profile.model.ts"
import { useEffect } from "react"

export default function useProfile(): Profile | null {
    const [auth] = useAtom(authToken)
    const nav = useNavigate()

    const { data, error, isLoading } = useQuery({
        queryKey: ["user"],
        queryFn: async () => await getUser()
    })

    // if the request fails, log the user out
    useEffect(() => {
        if (auth !== "" && error && !isLoading) {
            nav("/welcome")
        }
    }, [auth, error, isLoading, nav])

    // the user is not logged in
    if (!auth || auth === "" || !data) {
        return null
    }

    return data.profile
}
