import { BASE_URL } from "@api/util.ts"
import type {
    BurrowResponse,
    BurrowType,
    BurrowMembershipResponse,
    BurrowRole
} from "./burrows.types.ts"
import type { PaginatedResponse } from "@api/api.types.ts"
import { get, post } from "@api/api.ts"

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
 * @param auth The authorization token.
 * @param type The type of meetings to get.
 * @return The meeting response, including membership and meeting information.
 */
export async function getMeetings(
    auth: string,
    type: BurrowType | null
): Promise<PaginatedResponse<BurrowResponse>> {
    const request = await fetch(`${BASE_URL}/burrows?type=${type}`, {
        headers: {
            Authorization: `Bearer ${auth}`
        }
    })

    return await request.json()
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
 * @param auth The authorization token.
 * @param meetingId The ID of the meeting to view attendees for.
 */
export async function getAttendees(
    auth: string,
    meetingId: string
): Promise<BurrowMembershipResponse[]> {
    const request = await fetch(`${BASE_URL}/burrows/${meetingId}/attendees`, {
        headers: {
            Authorization: `Bearer ${auth}`
        }
    })

    return await request.json()
}

/**
 * Search through meetings with a query.
 *
 * @param auth The authorization token.
 * @param type The type of group.
 * @param query The search query.
 * @param startDate The beginning of a time range to search through.
 * @param endDate The ending of a time range to search through.
 */
export async function searchMeetings(
    auth: string,
    type: BurrowType | null,
    query: string,
    startDate?: number,
    endDate?: number
): Promise<PaginatedResponse<BurrowResponse>> {
    const params = `?query=${encodeURIComponent(query)}&type=${type}&start=${startDate}&end=${endDate}`

    const res = await fetch(`${BASE_URL}/burrows/search${params}`, {
        headers: {
            Authorization: `Bearer ${auth}`
        }
    })

    return await res.json()
}

/**
 * Change the role of a user.
 *
 * @param auth The authorization token.
 * @param meetingId The meeting to adjust the role in.
 * @param userId The user to adjust the role of.
 * @param role The new role for the user.
 */
export async function changeRole(
    auth: string,
    meetingId: string,
    userId: string,
    role: BurrowRole
) {
    await fetch(`${BASE_URL}/burrows/${meetingId}/role`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth}`
        },
        body: JSON.stringify({
            userId,
            role
        })
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
 * @param auth The authorization token.
 * @param meetingId The ID of the meeting.
 * @param userId The ID of the user to ban / unban.
 */
export async function toggleBanMember(
    auth: string,
    meetingId: string,
    userId: string
): Promise<void> {
    const res = await fetch(`${BASE_URL}/burrows/${meetingId}/status`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${auth}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            userId
        })
    })

    if (!res.ok) {
        const message = await res.text().catch(() => "Failed to ban member")
        throw new Error(message || "Failed to ban member")
    }
}

/**
 * Get the schedule.
 *
 * @param auth The authorization token.
 */
export async function getSchedule(auth: string): Promise<BurrowResponse[]> {
    const request = await fetch(`${BASE_URL}/burrows/schedule`, {
        headers: {
            Authorization: `Bearer ${auth}`
        }
    })

    if (!request.ok) return Promise.reject("Failed to load schedule.")

    return await request.json()
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
