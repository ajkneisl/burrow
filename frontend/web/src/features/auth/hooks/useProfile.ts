import { useAtom } from "jotai"
import { authToken } from "@features/auth/auth.atom.ts"
import { useNavigate } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { getUser } from "@features/auth/user.api.ts"
import type { Profile } from "@features/profile/profile.model.ts"

export default function useProfile(): Profile | null {
    const [auth, setAuth] = useAtom(authToken)
    const nav = useNavigate()

    const { data, error } = useQuery({
        queryKey: ["user"],
        enabled: auth !== "",
        queryFn: async () => await getUser(auth)
    })

    // if the request fails, log the user out
    if (auth !== "" && error) {
        setAuth("")
        nav("/welcome")
        return null
    }

    // the user is not logged in
    if (!auth || auth === "" || !data) {
        return null
    }

    return data.profile
}
