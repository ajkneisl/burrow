
import { getUser } from "@umnburrow/core/api"
import type { User } from "@umnburrow/core/api"
import { useAtom } from "jotai"
import { authToken } from "../auth.atom"
import { useQuery } from "@tanstack/react-query"

/**
 * Retrieve the `User` object.
 */
export default function useUser(): User | null {
    const [auth] = useAtom(authToken)

    const { data } = useQuery({
        queryKey: ["user"],
        queryFn: async () => await getUser()
    })

    // the user is not logged in
    if (!auth || auth === "" || !data) {
        return null
    }

    return data.user
}
