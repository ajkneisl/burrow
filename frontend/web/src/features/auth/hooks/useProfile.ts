import { useAtom } from "jotai"
import { authToken } from "@features/auth/auth.atom.ts"
import { useQuery } from "@tanstack/react-query"
import { getUser } from "@features/auth/user.api.ts"
import type { Profile } from "@features/profile/profile.model.ts"

export default function useProfile(): Profile | null {
    const [auth] = useAtom(authToken)

    const { data } = useQuery({
        queryKey: ["user"],
        queryFn: async () => await getUser()
    })

    // the user is not logged in
    if (!auth || auth === "" || !data) {
        return null
    }

    return data.profile
}
