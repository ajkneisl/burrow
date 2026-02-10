import { del, get, patch, post } from "@api/api.ts"
import type { PaginatedResponse } from "@api/api.types.ts"
import { BASE_URL } from "@api/util.ts"
import type { BurrowResponse } from "@features/burrows/burrows.types.tsx"
import type { Club, ClubResponse, ClubMemberResponse, ClubRole, MyClubResponse, SubmittedClub } from "./clubs.types.ts"

export async function getClub(name: string): Promise<ClubResponse> {
    return await get(`/clubs/${name}`)
}

export async function getClubMembers(
    clubName: string,
    page: number = 1
): Promise<PaginatedResponse<ClubMemberResponse>> {
    return await get(`/clubs/${clubName}/members`, { query: { page } })
}

export async function joinClub(clubName: string) {
    return await post(`/clubs/${clubName}/join`)
}

export async function leaveClub(clubName: string) {
    return await post(`/clubs/${clubName}/leave`)
}

export async function kickClubMember(clubName: string, userID: string) {
    return await patch(`/clubs/${clubName}/kick`, { userID })
}

export async function changeClubRole(
    clubName: string,
    userID: string,
    role: ClubRole,
    roleName?: string
) {
    return await patch(`/clubs/${clubName}/role`, { userID, role, roleName })
}

export async function cancelClubJoinRequest(clubName: string) {
    return await del(`/clubs/${clubName}/requests`)
}

export async function getMyClubs(): Promise<MyClubResponse[]> {
    return await get(`/clubs/mine`)
}

export async function createClub(submittedClub: SubmittedClub): Promise<Club> {
    return await post(`/clubs`, submittedClub)
}

export async function updateClub(clubName: string, submittedClub: Partial<SubmittedClub>): Promise<void> {
    return await patch(`/clubs/${clubName}`, submittedClub)
}

export async function inviteToClub(clubName: string, inviteeID: string): Promise<void> {
    return await post(`/clubs/${clubName}/invites`, { inviteeID })
}

export async function getClubBurrows(clubName: string): Promise<BurrowResponse[]> {
    return await get(`/clubs/${clubName}/burrows`)
}

export async function uploadClubPhoto(clubName: string, file: File, token: string) {
    const response = await fetch(`${BASE_URL}/clubs/${clubName}/photo`, {
        method: "POST",
        headers: {
            "Content-Type": file.type,
            Authorization: `Bearer ${token}`,
        },
        body: file,
    })
    if (!response.ok) {
        const error = await response.json()
        throw error.message || "Failed to upload photo"
    }
    return response.json()
}

export async function deleteClubPhoto(clubName: string, token: string) {
    const response = await fetch(`${BASE_URL}/clubs/${clubName}/photo`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) throw "Failed to delete photo"
}

export async function uploadClubBanner(clubName: string, file: File, token: string) {
    const response = await fetch(`${BASE_URL}/clubs/${clubName}/banner`, {
        method: "POST",
        headers: {
            "Content-Type": file.type,
            Authorization: `Bearer ${token}`,
        },
        body: file,
    })
    if (!response.ok) {
        const error = await response.json()
        throw error.message || "Failed to upload banner"
    }
    return response.json()
}

export async function deleteClubBanner(clubName: string, token: string) {
    const response = await fetch(`${BASE_URL}/clubs/${clubName}/banner`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) throw "Failed to delete banner"
}
