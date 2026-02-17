import { del, get, patch, post, request } from "@api/api.ts"
import type { PaginatedResponse } from "@api/api.types.ts"
import type { BurrowResponse } from "@features/burrows/burrows.types.tsx"
import type {
    Club,
    ClubResponse,
    ClubMemberResponse,
    ClubRole,
    MyClubResponse,
    SubmittedClub
} from "./clubs.types.ts"

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

export async function updateClub(
    clubName: string,
    submittedClub: Partial<SubmittedClub>
): Promise<void> {
    return await patch(`/clubs/${clubName}`, submittedClub)
}

export async function verifyClubFields(
    fields: Partial<SubmittedClub>
): Promise<void> {
    return await post(`/clubs/verify`, fields)
}

export async function inviteToClub(
    clubName: string,
    inviteeID: string
): Promise<void> {
    return await post(`/clubs/${clubName}/invites`, { inviteeID })
}

export async function getClubBurrows(
    clubName: string
): Promise<BurrowResponse[]> {
    return await get(`/clubs/${clubName}/burrows`)
}

export async function uploadClubPhoto(clubName: string, file: File) {
    return await request("POST", `/clubs/${clubName}/photo`, {
        data: file,
        contentType: file.type
    })
}

export async function deleteClubPhoto(clubName: string) {
    await del(`/clubs/${clubName}/photo`)
}

export async function uploadClubBanner(clubName: string, file: File) {
    return await request("POST", `/clubs/${clubName}/banner`, {
        data: file,
        contentType: file.type
    })
}

export async function deleteClubBanner(clubName: string) {
    await del(`/clubs/${clubName}/banner`)
}
