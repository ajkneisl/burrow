import type { User } from "../user.types.ts"
import { useAtom } from "jotai"
import { authToken } from "../auth.atom.ts"
import { useQuery } from "@tanstack/react-query"
import { getUser } from "@features/auth/api/user.api.ts"
import { useNavigate } from "react-router"

/**
 * Retrieve the `User` object.
 */
export default function useUser(): User | null {
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

    return data
}
