import { useAtom } from "jotai"
import { authToken } from "../auth.atom.ts"

/**
 * Get the authorization token. If the user isn't logged in, return `null`.
 *
 * @see authToken
 */
export default function useToken(): string | null {
    const [token] = useAtom(authToken)

    return token === "" ? null : token
}
