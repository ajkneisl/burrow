import { del, get, post } from "@api/api"
import type {
    InviteWithUsers,
    JoinRequestWithUser
} from "@features/burrows/burrows.types"
import type { PaginatedResponse } from "@api/api.types"

/**
 * Get all pending join requests for a burrow.
 *
 * @param burrowId The ID of the burrow.
 * @param page The page number (defaults to 1).
 */
export async function getJoinRequests(
    burrowId: string,
    page: number = 1
): Promise<PaginatedResponse<JoinRequestWithUser>> {
    return get<PaginatedResponse<JoinRequestWithUser>>(
        `/burrows/${burrowId}/requests`,
        { query: { page } }
    )
}

/**
 * Accept a join request.
 *
 * @param burrowId The ID of the burrow.
 * @param requesterId The ID of the user who made the request.
 */
export async function acceptJoinRequest(
    burrowId: string,
    requesterId: string
): Promise<void> {
    return post(`/burrows/${burrowId}/requests/accept`, { requesterId })
}

/**
 * Deny a join request.
 *
 * @param burrowId The ID of the burrow.
 * @param requesterId The ID of the user who made the request.
 */
export async function denyJoinRequest(
    burrowId: string,
    requesterId: string
): Promise<void> {
    return post(`/burrows/${burrowId}/requests/deny`, { requesterId })
}

/**
 * Get all pending invites for a burrow.
 *
 * @param burrowId The ID of the burrow.
 * @param page The page number (defaults to 1).
 */
export async function getInvites(
    burrowId: string,
    page: number = 1
): Promise<PaginatedResponse<InviteWithUsers>> {
    return get<PaginatedResponse<InviteWithUsers>>(
        `/burrows/${burrowId}/invites`,
        { query: { page } }
    )
}

/**
 * Create an invite to a burrow.
 *
 * @param burrowId The ID of the burrow.
 * @param inviteeId The ID of the user to invite.
 * @param expiresAt Optional expiration timestamp (epoch ms).
 */
export async function createInvite(
    burrowId: string,
    inviteeId: string,
    expiresAt?: number
): Promise<void> {
    return post(`/burrows/${burrowId}/invites`, { inviteeId, expiresAt })
}

/**
 * Cancel an invite to a burrow.
 *
 * @param burrowId The ID of the burrow.
 * @param inviteeId The ID of the user who was invited.
 */
export async function cancelInvite(
    burrowId: string,
    inviteeId: string
): Promise<void> {
    return del(`/burrows/${burrowId}/invites/${inviteeId}`)
}

/**
 * Get all invites received by the authenticated user.
 *
 * @param status Optional status filter (PENDING, ACCEPTED, DECLINED, EXPIRED).
 */
export async function getReceivedInvites(
    status?: string
): Promise<InviteWithUsers[]> {
    return get<InviteWithUsers[]>("/burrows/invites/received", {
        query: status ? { status } : undefined
    })
}

/**
 * Accept an invite to a burrow.
 *
 * @param burrowID The ID of the burrow.
 */
export async function acceptInvite(burrowID: string): Promise<void> {
    return post(`/burrows/invites/${burrowID}/accept`)
}

/**
 * Decline an invite to a burrow.
 *
 * @param burrowID The ID of the burrow.
 */
export async function declineInvite(burrowID: string): Promise<void> {
    return post(`/burrows/invites/${burrowID}/decline`)
}

/**
 * Cancel a join request.
 *
 * @param burrowID The ID of the burrow that was cancel requested.
 */
export async function cancelJoinRequest(burrowID: string): Promise<void> {
    return del(`/burrows/${burrowID}/requests`)
}
