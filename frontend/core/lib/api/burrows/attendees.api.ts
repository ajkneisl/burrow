import { del, get, post } from "../client"
import type { PaginatedResponse } from "../types"
import type { InviteWithUsers, JoinRequestWithUser } from "./burrows.models"

/**
 * Get all pending join requests for a Burrow.
 *
 * @param burrowID The ID of the Burrow.
 * @param page The page number.
 */
export async function getJoinRequests(
    burrowID: string,
    page: number = 1
): Promise<PaginatedResponse<JoinRequestWithUser>> {
    return get(`/burrows/${burrowID}/requests`, { query: { page } })
}

/**
 * Accept a join request.
 *
 * @param burrowID The ID of the Burrow.
 * @param requesterId The ID of the user who made the request.
 */
export async function acceptJoinRequest(
    burrowID: string,
    requesterId: string
): Promise<void> {
    return post(`/burrows/${burrowID}/requests/accept`, { requesterId })
}

/**
 * Deny a join request.
 *
 * @param burrowID The ID of the Burrow.
 * @param requesterId The ID of the user who made the request.
 */
export async function denyJoinRequest(
    burrowID: string,
    requesterId: string
): Promise<void> {
    return post(`/burrows/${burrowID}/requests/deny`, { requesterId })
}

/**
 * Cancel the requesting user's join request.
 *
 * @param burrowID The ID of the Burrow that was requested.
 */
export async function cancelJoinRequest(burrowID: string): Promise<void> {
    return del(`/burrows/${burrowID}/requests`)
}

/**
 * Get all pending invites for a Burrow.
 *
 * @param burrowID The ID of the Burrow.
 * @param page The page number.
 */
export async function getInvites(
    burrowID: string,
    page: number = 1
): Promise<PaginatedResponse<InviteWithUsers>> {
    return get(`/burrows/${burrowID}/invites`, { query: { page } })
}

/**
 * Create an invite to a Burrow.
 *
 * @param burrowID The ID of the Burrow.
 * @param inviteeId The ID of the user to invite.
 * @param expiresAt Optional expiration timestamp (epoch millis).
 */
export async function createInvite(
    burrowID: string,
    inviteeId: string,
    expiresAt?: number
): Promise<void> {
    return post(`/burrows/${burrowID}/invites`, { inviteeId, expiresAt })
}

/**
 * Cancel an invite to a Burrow.
 *
 * @param burrowID The ID of the Burrow.
 * @param inviteeId The ID of the user who was invited.
 */
export async function cancelInvite(
    burrowID: string,
    inviteeId: string
): Promise<void> {
    return del(`/burrows/${burrowID}/invites/${inviteeId}`)
}

/**
 * Get all invites received by the requesting user.
 *
 * @param status Optional status filter.
 */
export async function getReceivedInvites(
    status?: string
): Promise<InviteWithUsers[]> {
    return get("/burrows/invites/received", {
        query: status ? { status } : undefined
    })
}

/**
 * Accept an invite to a Burrow.
 *
 * @param burrowID The ID of the Burrow.
 */
export async function acceptInvite(burrowID: string): Promise<void> {
    return post(`/burrows/invites/${burrowID}/accept`)
}

/**
 * Decline an invite to a Burrow.
 *
 * @param burrowID The ID of the Burrow.
 */
export async function declineInvite(burrowID: string): Promise<void> {
    return post(`/burrows/invites/${burrowID}/decline`)
}
