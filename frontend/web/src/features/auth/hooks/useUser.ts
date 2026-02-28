import type { User } from "../user.types.ts"
import { useAtom } from "jotai"
import { authToken } from "../auth.atom.ts"
import {
    useQuery,
    useQueryClient,
    useQueryErrorResetBoundary
} from "@tanstack/react-query"
import { getUser } from "@features/auth/user.api.ts"
import { useNavigate } from "react-router"

/**
 * Retrieve the `User` object.
 */
export default function useUser(): User | null {
    const { reset } = useQueryErrorResetBoundary()
    const queryClient = useQueryClient()

    const nav = useNavigate()

    const [auth, setAuth] = useAtom(authToken)

    const { data, error, isLoading } = useQuery({
        queryKey: ["user"],
        queryFn: async () => await getUser()
    })

    // if the request fails, log the user out
    if (
        auth !== "" &&
        `${error}` === "Token is invalid or expired." &&
        !isLoading
    ) {
        queryClient.resetQueries({ queryKey: ["user"] })
        setAuth("")
        nav("/welcome")
        reset()

        return null
    }

    // the user is not logged in
    if (!auth || auth === "" || !data) {
        return null
    }

    return data.user
}
