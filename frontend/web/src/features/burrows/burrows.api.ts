import { BASE_URL } from "@api/util.ts"
import type {
    Burrow,
    BurrowResponse,
    BurrowType,
    JoinRequestWithUser,
    BurrowMembershipResponse,
    BurrowRole,
    SubmittedGroupMeeting,
    InviteWithUsers
} from "./burrows.types.ts"
import type { PaginatedResponse } from "@api/api.types.ts"

/**
 * Create a group.
 *
 * @param auth The authorization token.
 * @param submittedGroup The submitted group.
 */
export async function createMeeting(
    auth: string,
    submittedGroup: SubmittedGroupMeeting
): Promise<Burrow | string[]> {
    const request = await fetch(`${BASE_URL}/burrows`, {
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
    const request = await fetch(`${BASE_URL}/burrows/${meetingId}`, {
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
 * Get a {@link BurrowResponse} by it's ID.
 *
 * @param auth The authorization token.
 * @param id The ID of the meeting
 * @return The meeting response, including membership and meeting information.
 */
export async function getMeeting(
    id: string,
    auth?: string | null
): Promise<BurrowResponse> {
    const request = await fetch(
        `${BASE_URL}/burrows/${id}`,
        auth
            ? {
                  headers: {
                      Authorization: `Bearer ${auth}`
                  }
              }
            : {}
    )

    return await request.json()
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
 * @param auth The authorization token.
 * @param meeting The meeting to join.
 */
export async function joinMeeting(auth: string, meeting: string) {
    const request = await fetch(`${BASE_URL}/burrows/${meeting}/join`, {
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
 * Leave a {@link Burrow}.
 *
 * @param auth The authorization token.
 * @param meeting The meeting to leave.
 */
export async function leaveMeeting(auth: string, meeting: string) {
    const request = await fetch(`${BASE_URL}/burrows/${meeting}/leave`, {
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

/**
 * Get all pending join requests for a burrow.
 *
 * @param auth The authorization token.
 * @param burrowId The ID of the burrow.
 */
export async function getJoinRequests(
    auth: string,
    burrowId: string
): Promise<JoinRequestWithUser[]> {
    const request = await fetch(`${BASE_URL}/burrows/${burrowId}/requests`, {
        headers: {
            Authorization: `Bearer ${auth}`
        }
    })

    if (!request.ok) return Promise.reject("Failed to load join requests.")

    return await request.json()
}

/**
 * Accept a join request.
 *
 * @param auth The authorization token.
 * @param burrowId The ID of the burrow.
 * @param requesterId The ID of the user who made the request.
 */
export async function acceptJoinRequest(
    auth: string,
    burrowId: string,
    requesterId: string
): Promise<void> {
    const request = await fetch(
        `${BASE_URL}/burrows/${burrowId}/requests/accept`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${auth}`
            },
            body: JSON.stringify({ requesterId })
        }
    )

    if (!request.ok) return Promise.reject("Failed to accept join request.")
}

/**
 * Deny a join request.
 *
 * @param auth The authorization token.
 * @param burrowId The ID of the burrow.
 * @param requesterId The ID of the user who made the request.
 */
export async function denyJoinRequest(
    auth: string,
    burrowId: string,
    requesterId: string
): Promise<void> {
    const request = await fetch(
        `${BASE_URL}/burrows/${burrowId}/requests/deny`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${auth}`
            },
            body: JSON.stringify({ requesterId })
        }
    )

    if (!request.ok) return Promise.reject("Failed to deny join request.")
}

/**
 * Get all pending invites for a burrow.
 *
 * @param auth The authorization token.
 * @param burrowId The ID of the burrow.
 */
export async function getInvites(
    auth: string,
    burrowId: string
): Promise<InviteWithUsers[]> {
    const request = await fetch(`${BASE_URL}/burrows/${burrowId}/invites`, {
        headers: {
            Authorization: `Bearer ${auth}`
        }
    })

    if (!request.ok) return Promise.reject("Failed to load invites.")

    return await request.json()
}

/**
 * Create an invite to a burrow.
 *
 * @param auth The authorization token.
 * @param burrowId The ID of the burrow.
 * @param inviteeId The ID of the user to invite.
 * @param expiresAt Optional expiration timestamp (epoch ms).
 */
export async function createInvite(
    auth: string,
    burrowId: string,
    inviteeId: string,
    expiresAt?: number
): Promise<void> {
    const request = await fetch(`${BASE_URL}/burrows/${burrowId}/invites`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${auth}`
        },
        body: JSON.stringify({ inviteeId, expiresAt })
    })

    if (!request.ok) {
        const error = await request.json().catch(() => ({ error: "Failed to create invite" }))
        return Promise.reject(error.error || "Failed to create invite.")
    }
}

/**
 * Cancel an invite to a burrow.
 *
 * @param auth The authorization token.
 * @param burrowId The ID of the burrow.
 * @param inviteeId The ID of the user who was invited.
 */
export async function cancelInvite(
    auth: string,
    burrowId: string,
    inviteeId: string
): Promise<void> {
    const request = await fetch(
        `${BASE_URL}/burrows/${burrowId}/invites/${inviteeId}`,
        {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${auth}`
            }
        }
    )

    if (!request.ok) return Promise.reject("Failed to cancel invite.")
}

/**
 * Get all invites received by the authenticated user.
 *
 * @param auth The authorization token.
 * @param status Optional status filter (PENDING, ACCEPTED, DECLINED, EXPIRED).
 */
export async function getReceivedInvites(
    auth: string,
    status?: string
): Promise<InviteWithUsers[]> {
    const url = status
        ? `${BASE_URL}/burrows/invites/received?status=${status}`
        : `${BASE_URL}/burrows/invites/received`

    const request = await fetch(url, {
        headers: {
            Authorization: `Bearer ${auth}`
        }
    })

    if (!request.ok) return Promise.reject("Failed to load received invites.")

    return await request.json()
}

/**
 * Accept an invite to a burrow.
 *
 * @param auth The authorization token.
 * @param burrowId The ID of the burrow.
 */
export async function acceptInvite(
    auth: string,
    burrowId: string
): Promise<void> {
    const request = await fetch(`${BASE_URL}/burrows/invites/${burrowId}/accept`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${auth}`
        }
    })

    if (!request.ok) {
        const error = await request.json().catch(() => ({ error: "Failed to accept invite" }))
        return Promise.reject(error.error || "Failed to accept invite.")
    }
}

/**
 * Decline an invite to a burrow.
 *
 * @param auth The authorization token.
 * @param burrowId The ID of the burrow.
 */
export async function declineInvite(
    auth: string,
    burrowId: string
): Promise<void> {
    const request = await fetch(`${BASE_URL}/burrows/invites/${burrowId}/decline`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${auth}`
        }
    })

    if (!request.ok) return Promise.reject("Failed to decline invite.")
}
