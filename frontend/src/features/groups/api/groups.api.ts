import { BASE_URL } from "@api/util.ts"
import type {
    GroupMeeting,
    GroupMeetingResponse,
    GroupType,
    MeetingMembershipResponse,
    SubmittedGroupMeeting
} from "./groups.types.ts"

/**
 * Create a group.
 *
 * @param auth The authorization token.
 * @param submittedGroup The submitted group.
 */
export async function createMeeting(
    auth: string,
    submittedGroup: SubmittedGroupMeeting
): Promise<GroupMeeting | string[]> {
    const request = await fetch(`${BASE_URL}/groups`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + auth
        },
        body: JSON.stringify(submittedGroup)
    })

    if (!request.ok) {
        return (await request.json()).errors
    }

    return await request.json()
}

/**
 * Modify a group.
 *
 * @param auth The authorization token.
 * @param meetingId The ID of the meeting to update.
 * @param updatedGroup The updated group.
 */
export async function updateMeeting(
    auth: string,
    meetingId: string,
    updatedGroup: SubmittedGroupMeeting
) {
    const request = await fetch(`${BASE_URL}/groups/${meetingId}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + auth
        },
        body: JSON.stringify(updatedGroup)
    })

    if (!request.ok) {
        return (await request.json()).errors
    }
}

/**
 * Get a {@link GroupMeetingResponse} by it's ID.
 *
 * @param auth The authorization token.
 * @param id The ID of the meeting
 * @return The meeting response, including membership and meeting information.
 */
export async function getMeeting(
    auth: string,
    id: string
): Promise<GroupMeetingResponse> {
    const request = await fetch(`${BASE_URL}/groups/${id}`, {
        headers: {
            Authorization: `Bearer ${auth}`
        }
    })

    return await request.json()
}

/**
 * Get list of {@link GroupMeetingResponse}.
 *
 * @param auth The authorization token.
 * @param type The type of meetings to get.
 * @return The meeting response, including membership and meeting information.
 */
export async function getMeetings(
    auth: string,
    type: GroupType | null
): Promise<GroupMeetingResponse[]> {
    const request = await fetch(`${BASE_URL}/groups?type=${type}`, {
        headers: {
            Authorization: `Bearer ${auth}`
        }
    })

    return await request.json()
}

/**
 * Join a {@link GroupMeeting}.
 *
 * @param auth The authorization token.
 * @param meeting The meeting to join.
 */
export async function joinMeeting(auth: string, meeting: string) {
    const request = await fetch(`${BASE_URL}/groups/${meeting}/join`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${auth}`
        }
    })

    if (!request.ok) {
        const requestBody = await request.json()

        return Promise.reject(requestBody.error)
    }
}

/**
 * Leave a {@link GroupMeeting}.
 *
 * @param auth The authorization token.
 * @param meeting The meeting to leave.
 */
export async function leaveMeeting(auth: string, meeting: string) {
    const request = await fetch(`${BASE_URL}/groups/${meeting}/leave`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${auth}`
        }
    })

    if (!request.ok) {
        const requestBody = await request.json()

        return Promise.reject(requestBody.error)
    }
}

/**
 * Delete a {@link GroupMeeting} by it's ID.
 *
 * @param auth The authorization token.
 * @param id The meeting to delete.
 */
export async function deleteMeeting(auth: string, id: string) {
    const request = await fetch(`${BASE_URL}/groups/${id}`, {
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
    const request = await fetch(`${BASE_URL}/groups/${id}/bookmark`, {
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
    const request = await fetch(`${BASE_URL}/groups/${id}/bookmark`, {
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
): Promise<MeetingMembershipResponse[]> {
    const request = await fetch(`${BASE_URL}/groups/${meetingId}/attendees`, {
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
 */
export async function searchMeetings(
    auth: string,
    type: GroupType | null,
    query: string
): Promise<GroupMeetingResponse[]> {
    const params = `?query=${encodeURIComponent(query)}&type=${type}`

    const res = await fetch(`${BASE_URL}/groups/search${params}`, {
        headers: {
            Authorization: `Bearer ${auth}`
        }
    })

    return await res.json()
}
