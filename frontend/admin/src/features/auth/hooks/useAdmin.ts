import { useQuery } from "@tanstack/react-query"
import { useAtom } from "jotai"
import { adminTokenAtom } from "../admin.atom.ts"
import type { Administrator } from "../admin.models.ts"
import { getAdmin } from "../admin.api.ts"

/**
 * Retrieve the administrato details.
 */
export default function useAdmin(): Administrator | null {
    const [token, setToken] = useAtom(adminTokenAtom)

    const { data, isLoading, isError } = useQuery({
        queryKey: ["account"],
        retry: 5,
        enabled: token !== undefined && token !== "",
        queryFn: () => getAdmin(token ?? ""),
        refetchOnWindowFocus: true
    })

    if (isLoading || !data) return null

    if (isError) {
        setToken("")
        return null
    }

    return data
}
