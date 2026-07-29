import { del, get, patch, post, request } from "@api/api.ts"
import type { PaginatedResponse } from "@api/api.types.ts"
import type { BurrowResponse } from "@features/burrows/burrows.types.tsx"
import type {
    Club,
    ClubCategory,
    ClubResponse,
    ClubMemberResponse,
    ClubRole,
    MyClubResponse,
    SubmittedClub
} from "./clubs.types.ts"

/**
 * Get a club by its name.
 *
 * @param clubName The name of the club.
 */
export async function getClub(clubName: string): Promise<ClubResponse> {
    return await get(`/clubs/${clubName}`)
}

/**
 * Get a page of a club's members.
 *
 * @param clubName The name of the club.
 * @param page The page to retrieve.
 */
export async function getClubMembers(
    clubName: string,
    page: number = 1
): Promise<PaginatedResponse<ClubMemberResponse>> {
    return await get(`/clubs/${clubName}/members`, { query: { page } })
}

/**
 * Join a club by its name.
 *
 * @param clubName The name of the club.
 */
export async function joinClub(clubName: string) {
    return await post(`/clubs/${clubName}/join`)
}

/**
 * Leave a club by its name.
 *
 * @param clubName The name of the club.
 */
export async function leaveClub(clubName: string) {
    return await post(`/clubs/${clubName}/leave`)
}

/**
 * Kick a club member out.
 *
 * @param clubName The name of the club.
 * @param userID The user ID to kick.
 */
export async function kickClubMember(clubName: string, userID: string) {
    return await patch(`/clubs/${clubName}/kick`, { userID })
}

/**
 * Change a user's club role.
 *
 * @param clubName The name of the club.
 * @param userID The user ID to adjust the role of.
 * @param role The new role.
 * @param roleName The customized name of the role.
 */
export async function changeClubRole(
    clubName: string,
    userID: string,
    role: ClubRole,
    roleName?: string
) {
    return await patch(`/clubs/${clubName}/role`, { userID, role, roleName })
}

/**
 * Cancel a request to join a club.
 *
 * @param clubName The name of the club.
 */
export async function cancelClubJoinRequest(clubName: string) {
    return await del(`/clubs/${clubName}/requests`)
}

/**
 * Browse/discover clubs with optional category filter.
 *
 * @param page The page to retrieve.
 * @param category Optional category filter.
 */
export async function discoverClubs(
    page: number = 1,
    category?: ClubCategory
): Promise<PaginatedResponse<Club>> {
    return await get(`/clubs`, {
        query: { page, ...(category ? { category } : {}) }
    })
}

/**
 * Get the clubs the user is a moderator or administrator of.
 */
export async function getMyClubs(): Promise<MyClubResponse[]> {
    return await get(`/clubs/mine`)
}

/**
 * Create a club.
 *
 * @param submittedClub The details of the club to create.
 */
export async function createClub(submittedClub: SubmittedClub): Promise<Club> {
    return await post(`/clubs`, submittedClub)
}

/**
 * Update a club.
 *
 * @param clubName The current name of the club.
 * @param submittedClub The details of the club.
 */
export async function updateClub(
    clubName: string,
    submittedClub: Partial<SubmittedClub>
): Promise<void> {
    return await patch(`/clubs/${clubName}`, submittedClub)
}

/**
 * Delete a club.
 *
 * @param clubName The name of the club to delete.
 */
export async function deleteClub(clubName: string): Promise<void> {
    return await del(`/clubs/${clubName}`)
}

/**
 * Verify fields of a {@link SubmittedClub}.
 *
 * @param fields The fields to verify.
 */
export async function verifyClubFields(
    fields: Partial<SubmittedClub>
): Promise<void> {
    return await post(`/clubs/verify`, fields)
}

/**
 * Invite a user to a club.
 *
 * @param clubName The name of the club.
 * @param inviteeID The ID of the user to invite.
 */
export async function inviteToClub(
    clubName: string,
    inviteeID: string
): Promise<void> {
    return await post(`/clubs/${clubName}/invites`, { inviteeID })
}

/**
 * Get a club's Burrows.
 *
 * @param clubName The name of the club.
 */
export async function getClubBurrows(
    clubName: string
): Promise<BurrowResponse[]> {
    return await get(`/clubs/${clubName}/burrows`)
}

/**
 * Get a page of a club's Burrow history. Moderators and administrators only.
 *
 * @param clubName The name of the club.
 * @param page The page to retrieve.
 */
export async function getClubHistory(
    clubName: string,
    page: number = 1
): Promise<PaginatedResponse<BurrowResponse>> {
    return await get(`/clubs/${clubName}/history`, { query: { page } })
}

/**
 * Upload a new photo for a club.
 *
 * @param clubName The name of the club.
 * @param file The photo.
 */
export async function uploadClubPhoto(clubName: string, file: File) {
    return await request("POST", `/clubs/${clubName}/photo`, {
        data: file,
        contentType: file.type
    })
}

/**
 * Delete the current photo for a club.
 *
 * @param clubName The name of the club.
 */
export async function deleteClubPhoto(clubName: string) {
    await del(`/clubs/${clubName}/photo`)
}

/**
 * Upload a new banner for a club.
 *
 * @param clubName The name of the club.
 * @param file The banner.
 */
export async function uploadClubBanner(clubName: string, file: File) {
    return await request("POST", `/clubs/${clubName}/banner`, {
        data: file,
        contentType: file.type
    })
}

/**
 * Delete the current banner for a club.
 *
 * @param clubName The name of the club.
 */
export async function deleteClubBanner(clubName: string) {
    await del(`/clubs/${clubName}/banner`)
}
