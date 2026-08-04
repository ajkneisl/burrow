import { del, get, patch, post, request, type RawBody } from "../client"
import type { PaginatedResponse } from "../types"
import type { BurrowResponse } from "../burrows/burrows.models"
import type {
    Club,
    ClubCategory,
    ClubMemberResponse,
    ClubResponse,
    ClubRole,
    MyClubResponse,
    SubmittedClub
} from "./clubs.models"

/**
 * Get a club by its name.
 *
 * @param clubName The name of the club.
 */
export async function getClub(clubName: string): Promise<ClubResponse> {
    return get(`/clubs/${clubName}`)
}

/**
 * Browse clubs, optionally filtered by category.
 *
 * @param page The page to retrieve.
 * @param category Optional category filter.
 */
export async function discoverClubs(
    page: number = 1,
    category?: ClubCategory
): Promise<PaginatedResponse<Club>> {
    return get("/clubs", { query: { page, category } })
}

/**
 * Get the clubs the requesting user belongs to.
 */
export async function getMyClubs(): Promise<MyClubResponse[]> {
    return get("/clubs/mine")
}

/**
 * Create a club.
 *
 * @param submittedClub The details of the club to create.
 */
export async function createClub(submittedClub: SubmittedClub): Promise<Club> {
    return post("/clubs", submittedClub)
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
    return patch(`/clubs/${clubName}`, submittedClub)
}

/**
 * Delete a club.
 *
 * @param clubName The name of the club to delete.
 */
export async function deleteClub(clubName: string): Promise<void> {
    return del(`/clubs/${clubName}`)
}

/**
 * Verify fields of a {@link SubmittedClub} before submitting it.
 *
 * @param fields The fields to verify.
 */
export async function verifyClubFields(
    fields: Partial<SubmittedClub>
): Promise<void> {
    return post("/clubs/verify", fields)
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
    return get(`/clubs/${clubName}/members`, { query: { page } })
}

/**
 * Join a club by its name.
 *
 * @param clubName The name of the club.
 */
export async function joinClub(clubName: string): Promise<void> {
    return post(`/clubs/${clubName}/join`)
}

/**
 * Leave a club by its name.
 *
 * @param clubName The name of the club.
 */
export async function leaveClub(clubName: string): Promise<void> {
    return post(`/clubs/${clubName}/leave`)
}

/**
 * Kick a club member out.
 *
 * @param clubName The name of the club.
 * @param userID The user to kick.
 */
export async function kickClubMember(
    clubName: string,
    userID: string
): Promise<void> {
    return patch(`/clubs/${clubName}/kick`, { userID })
}

/**
 * Change a user's club role.
 *
 * @param clubName The name of the club.
 * @param userID The user to adjust the role of.
 * @param role The new role.
 * @param roleName The customized name of the role.
 */
export async function changeClubRole(
    clubName: string,
    userID: string,
    role: ClubRole,
    roleName?: string
): Promise<void> {
    return patch(`/clubs/${clubName}/role`, { userID, role, roleName })
}

/**
 * Cancel the requesting user's request to join a club.
 *
 * @param clubName The name of the club.
 */
export async function cancelClubJoinRequest(clubName: string): Promise<void> {
    return del(`/clubs/${clubName}/requests`)
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
    return post(`/clubs/${clubName}/invites`, { inviteeID })
}

/**
 * Get a club's upcoming Burrows.
 *
 * @param clubName The name of the club.
 */
export async function getClubBurrows(
    clubName: string
): Promise<BurrowResponse[]> {
    return get(`/clubs/${clubName}/burrows`)
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
    return get(`/clubs/${clubName}/history`, { query: { page } })
}

/**
 * Upload a new photo for a club.
 *
 * @param clubName The name of the club.
 * @param file The photo.
 * @param contentType The MIME type of the photo.
 */
export async function uploadClubPhoto(
    clubName: string,
    file: RawBody,
    contentType: string
): Promise<void> {
    return request("POST", `/clubs/${clubName}/photo`, {
        data: file,
        contentType
    })
}

/**
 * Delete the current photo for a club.
 *
 * @param clubName The name of the club.
 */
export async function deleteClubPhoto(clubName: string): Promise<void> {
    return del(`/clubs/${clubName}/photo`)
}

/**
 * Upload a new banner for a club.
 *
 * @param clubName The name of the club.
 * @param file The banner.
 * @param contentType The MIME type of the banner.
 */
export async function uploadClubBanner(
    clubName: string,
    file: RawBody,
    contentType: string
): Promise<void> {
    return request("POST", `/clubs/${clubName}/banner`, {
        data: file,
        contentType
    })
}

/**
 * Delete the current banner for a club.
 *
 * @param clubName The name of the club.
 */
export async function deleteClubBanner(clubName: string): Promise<void> {
    return del(`/clubs/${clubName}/banner`)
}
