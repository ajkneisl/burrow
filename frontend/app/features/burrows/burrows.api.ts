import { BASE_URL } from "@api/util"
import type {
    BurrowResponse,
    BurrowKind,
    BurrowMembershipResponse,
    BurrowRole,
    ScheduleBurrowResponse,
    BurrowLocation,
    Burrow
} from "./burrows.types.tsx"
import type { PaginatedResponse } from "@api/api.types.ts"
import { del, get, patch, post, put } from "@api/api"
import type { SubmittedBurrow } from "./create/create.types"

/**
 * Get a {@link BurrowResponse} by its ID.
 *
 * @param id The ID of the meeting
 * @return The meeting response, including membership and meeting information.
 */
export async function getBurrow(id: string): Promise<BurrowResponse> {
    return await get(`/burrows/${id}`)
}

/**
 * Create a new burrow.
 *
 * @param data The burrow data to create (either Study/Event/Club or Project)
 * @return The created burrow wrapped in an object with a burrow property
 */
export async function createBurrow(data: SubmittedBurrow): Promise<Burrow> {
    return await post("/burrows", data)
}

/**
 * Update an existing burrow.
 *
 * @param burrowID The ID of the burrow to update
 * @param data The updated burrow data
 */
export async function updateBurrow(
    burrowID: string,
    data: SubmittedBurrow
): Promise<void> {
    return await patch(`/burrows/${burrowID}`, data)
}

/**
 * Get a list of {@link BurrowLocation}s to create a map.
 */
export async function getMap(): Promise<BurrowLocation[]> {
    return await get("/burrows/map")
}

/**
 * Get list of {@link BurrowResponse}.
 *
 * @param type The type of meetings to get.
 * @return The meeting response, including membership and meeting information.
 */
export async function getBurrows(
    type: BurrowKind | null
): Promise<PaginatedResponse<BurrowResponse>> {
    return get(`/burrows`, { query: { type: `${type}` } })
}

/**
 * Join a {@link Burrow}.
 *
 * @param meeting The meeting to join.
 */
export async function joinMeeting(meeting: string) {
    return post(`/burrows/${meeting}/join`)
}

/**
 * Join a {@link Burrow} - alias for mobile compatibility.
 *
 * @param id The burrow ID to join.
 */
export async function joinBurrow(id: string) {
    return post(`/burrows/${id}/join`)
}

/**
 * Leave a {@link Burrow}.
 *
 * @param meeting The meeting to leave.
 */
export async function leaveMeeting(meeting: string) {
    return post(`/burrows/${meeting}/leave`)
}

/**
 * Leave a {@link Burrow} - alias for mobile compatibility.
 *
 * @param id The burrow ID to leave.
 */
export async function leaveBurrow(id: string) {
    return post(`/burrows/${id}/leave`)
}

/**
 * Delete a {@link Burrow} by it's ID.
 *
 * @param id The meeting to delete.
 */
export async function deleteMeeting(id: string) {
    return del(`/burrows/${id}`)
}

/**
 * Bookmark a burrow.
 *
 * @param id The burrow to bookmark.
 */
export async function createBookmark(id: string): Promise<void> {
    return await put(`/burrows/${id}/bookmark`)
}

/**
 * Remove a bookmark from a burrow.
 *
 * @param id The burrow to un-bookmark.
 */
export async function deleteBookmark(id: string): Promise<void> {
    return await del(`/burrows/${id}/bookmark`)
}

/**
 * Get the attendees of a group.
 *
 * @param meetingId The ID of the meeting to view attendees for.
 * @param page The page number (defaults to 1).
 */
export async function getAttendees(
    meetingId: string,
    page: number = 1
): Promise<PaginatedResponse<BurrowMembershipResponse>> {
    return await get(`/burrows/${meetingId}/attendees`, {
        query: { page }
    })
}

/**
 * Search through meetings with a query.
 *
 * @param type The type of group.
 * @param query The search query.
 * @param page The page number (defaults to 1).
 * @param startDate The beginning of a time range to search through.
 * @param endDate The ending of a time range to search through.
 */
export async function searchMeetings(
    type: BurrowKind | null,
    query: string,
    page: number = 1,
    startDate?: number,
    endDate?: number,
    isHost?: boolean,
    isBookmarked?: boolean
): Promise<PaginatedResponse<BurrowResponse>> {
    return await get("/burrows/search", {
        query: {
            query,
            type: type ?? undefined,
            page,
            start: startDate,
            end: endDate,
            host: isHost ?? undefined,
            bookmarked: isBookmarked ?? undefined
        }
    })
}

/**
 * Change the role of a user.
 *
 * @param burrowID The meeting to adjust the role in.
 * @param userID The user to adjust the role of.
 * @param role The new role for the user.
 */
export async function changeRole(
    burrowID: string,
    userID: string,
    role: BurrowRole
) {
    return await patch(`/burrows/${burrowID}/role`, {
        userID,
        role
    })
}

/**
 * Change the status of a user. This is either banning or unbanning, depending on the user's current status.
 *
 * @param auth The authorization token.
 * @param meetingId The ID of the meeting.
 * @param userId The ID of the user to ban / unban.
 */
export async function changeStatus(
    auth: string,
    meetingId: string,
    userId: string
) {
    await fetch(`${BASE_URL}/burrows/${meetingId}/status`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth}`
        },
        body: JSON.stringify({
            userId
        })
    })
}

/**
 * Toggle the ban status on a member.
 *
 * @param burrowID The ID of the meeting.
 * @param userID The ID of the user to ban / unban.
 */
export async function toggleBanMember(
    burrowID: string,
    userID: string
): Promise<void> {
    return await patch(`/burrows/${burrowID}/status`, { userID })
}

/**
 * Get the schedule.
 */
export async function getSchedule(): Promise<ScheduleBurrowResponse[]> {
    const req: ScheduleBurrowResponse[] =
        await get(`/burrows/schedule`)

    return req
}

/**
 * Get all bookmarks.
 *
 * @param auth The authorization token.
 */
export async function getBookmarks(auth: string): Promise<BurrowResponse[]> {
    const request = await fetch(`${BASE_URL}/burrows/bookmarks`, {
        headers: {
            Authorization: `Bearer ${auth}`
        }
    })

    if (!request.ok) return Promise.reject("Failed to load schedule.")

    return await request.json()
}

/**
 * Get user's burrow history.
 *
 * @param page The page number (defaults to 1).
 */
export async function getUserHistory(
    page: number = 1
): Promise<PaginatedResponse<BurrowResponse>> {
    return await get("/user/history", {
        query: { page }
    })
}

/**
 * Get heatmap data showing burrow counts by day for the specified range of months.
 *
 * @param range The number of months to include (defaults to 1).
 * @returns Heatmap data mapping "YYYY-MM" to day counts
 */
export async function getBurrowHeatmap(
    range: number = 1
): Promise<Record<string, Record<number, number>>> {
    return await get("/burrows/heatmap", {
        query: { range }
    })
}
