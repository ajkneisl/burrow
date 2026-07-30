import { getAdmin } from "@umnburrow/core/api"
import type { AdminAccount } from "@umnburrow/core/api"
import { useQuery } from "@tanstack/react-query"
import { useAtom } from "jotai"
import { adminRefreshTokenAtom, adminTokenAtom } from "../admin.atom.ts"

/**
 * Retrieve the administrator's account details.
 */
export default function useAdmin(): AdminAccount | null {
    const [token, setToken] = useAtom(adminTokenAtom)
    const [, setRefreshToken] = useAtom(adminRefreshTokenAtom)

    const { data, isLoading, isError } = useQuery({
        queryKey: ["account", token],
        retry: 5,
        enabled: token !== undefined && token !== "",
        queryFn: () => getAdmin(),
        refetchOnWindowFocus: true
    })

    if (isError) {
        setToken("")
        setRefreshToken("")
        return null
    }

    if (isLoading || !data) return null

    return data
}
