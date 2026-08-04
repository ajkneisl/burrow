
import { ClubResponse, getClub } from "@umnburrow/core/api"
import { useQuery } from "@tanstack/react-query"
import useUser from "@features/auth/hooks/useUser"
import useToken from "@features/auth/hooks/useToken"

/**
 * Derive club role booleans from the club query cache.
 * Shares the same query key as the club page, so no extra fetch occurs.
 */
export default function useClubRole(clubName: string) {
    const auth = useToken()
    const user = useUser()

    const { data } = useQuery<ClubResponse>({
        queryKey: ["club", clubName],
        enabled: auth !== "" && !!clubName,
        queryFn: async () => await getClub(clubName)
    })

    const isOwner = user !== null && user.id === data?.club?.ownerID
    const isMember = data?.membership !== null
    const isAdmin = data?.membership?.role === "ADMINISTRATOR" || isOwner
    const isMod = isAdmin || data?.membership?.role === "MODERATOR"

    return { isOwner, isMember, isAdmin, isMod, user, data }
}
