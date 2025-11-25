import { BASE_URL } from "@api/util.ts"
import type {
    BurrowResponse,
    BurrowKind,
    BurrowMembershipResponse,
    BurrowRole,
    ScheduleBurrowResponse
} from "./burrows.types.tsx"
import type { PaginatedResponse } from "@api/api.types.ts"
import { get, patch, post } from "@api/api.ts"

/**
 * Get a {@link BurrowResponse} by its ID.
 *
 * @param id The ID of the meeting
 * @return The meeting response, including membership and meeting information.
 */
export async function getMeeting(id: string): Promise<BurrowResponse> {
    return get(`/burrows/${id}`)
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
 * Leave a {@link Burrow}.
 *
 * @param meeting The meeting to leave.
 */
export async function leaveMeeting(meeting: string) {
    return post(`/burrows/${meeting}/leave`)
}

/**
 * Delete a {@link Burrow} by it's ID.
 *
 * @param auth The authorization token.
 * @param id The meeting to delete.
 */
export async function deleteMeeting(auth: string, id: string) {
    const request = await fetch(`${BASE_URL}/burrows/${id}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${auth}`
        }
    })

    if (!request.ok) {
        return Promise.reject()
    }
}

/**
 * Bookmark a group.
 *
 * @param auth The authorization token.
 * @param id The meeting to bookmark.
 */
export async function createBookmark(auth: string, id: string) {
    const request = await fetch(`${BASE_URL}/burrows/${id}/bookmark`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${auth}`
        }
    })

    if (!request.ok) {
        return Promise.reject()
    }
}

/**
 * Delete a bookmark on a group.
 *
 * @param auth The authorization token.
 * @param id The meeting to un-bookmark.
 */
export async function deleteBookmark(auth: string, id: string) {
    const request = await fetch(`${BASE_URL}/burrows/${id}/bookmark`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${auth}`
        }
    })

    if (!request.ok) {
        return Promise.reject()
    }
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
    endDate?: number
): Promise<PaginatedResponse<BurrowResponse>> {
    return await get("/burrows/search", {
        query: {
            query,
            type: type ?? undefined,
            page,
            start: startDate,
            end: endDate
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
    return await get(`/burrows/schedule`)
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
