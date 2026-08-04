import { getUser } from "@umnburrow/core/api"
import type { Profile } from "@umnburrow/core/api"
import { useAtom } from "jotai"
import { authToken } from "@features/auth/auth.atom.ts"
import { useQuery } from "@tanstack/react-query"
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
