import { del, get, patch, post, put } from "../client"
import type { PaginatedResponse } from "../types"
import type {
    Burrow,
    BurrowKind,
    BurrowLocation,
    BurrowMembershipResponse,
    BurrowResponse,
    BurrowRole,
    ScheduleBurrowResponse,
    SubmittedBurrow
} from "./burrows.models"

/**
 * Get a {@link BurrowResponse} by its ID.
 *
 * @param id The ID of the meeting.
 * @return The meeting response, including membership and meeting information.
 */
export async function getBurrow(id: string): Promise<BurrowResponse> {
    return get(`/burrows/${id}`)
}

/**
 * Get a list of {@link BurrowResponse}.
 *
 * @param type The type of meetings to get.
 * @param excludeJoined If the list should exclude Burrows the user has already
 *   joined.
 */
export async function getBurrows(
    type: BurrowKind | null,
    excludeJoined?: boolean
): Promise<PaginatedResponse<BurrowResponse>> {
    return get("/burrows", {
        query: { type: `${type}`, exclude_joined: excludeJoined ?? false }
    })
}

/**
 * Create a new Burrow.
 *
 * @param submittedBurrow The Burrow to create.
 */
export async function createBurrow(
    submittedBurrow: SubmittedBurrow
): Promise<Burrow> {
    return post("/burrows", submittedBurrow)
}

/**
 * Update an existing Burrow.
 *
 * @param burrowID The ID of the Burrow to update.
 * @param submittedBurrow The updated Burrow.
 */
export async function updateBurrow(
    burrowID: string,
    submittedBurrow: SubmittedBurrow
): Promise<void> {
    return patch(`/burrows/${burrowID}`, submittedBurrow)
}

/**
 * Delete a Burrow by its ID.
 *
 * @param id The Burrow to delete.
 */
export async function deleteBurrow(id: string): Promise<void> {
    return del(`/burrows/${id}`)
}

/**
 * Join a Burrow.
 *
 * @param id The Burrow to join.
 */
export async function joinBurrow(id: string): Promise<void> {
    return post(`/burrows/${id}/join`)
}

/**
 * Leave a Burrow.
 *
 * @param id The Burrow to leave.
 */
export async function leaveBurrow(id: string): Promise<void> {
    return post(`/burrows/${id}/leave`)
}

/**
 * Search through Burrows with a query.
 *
 * @param type The type of group.
 * @param query The search query.
 * @param page The page number.
 * @param startDate The beginning of a time range to search through.
 * @param endDate The ending of a time range to search through.
 * @param isHost Only include Burrows the user hosts.
 * @param isBookmarked Only include Burrows the user has bookmarked.
 * @param isTa Only include Burrows hosted by an approved TA.
 */
export async function searchBurrows(
    type: BurrowKind | null,
    query: string,
    page: number = 1,
    startDate?: number,
    endDate?: number,
    isHost?: boolean,
    isBookmarked?: boolean,
    isTa?: boolean
): Promise<PaginatedResponse<BurrowResponse>> {
    return get("/burrows/search", {
        query: {
            query,
            type: type ?? undefined,
            page,
            start: startDate,
            end: endDate,
            host: isHost ?? undefined,
            bookmarked: isBookmarked ?? undefined,
            ta: isTa ?? undefined
        }
    })
}

/**
 * Get a list of {@link BurrowLocation}s to create a map.
 */
export async function getMap(): Promise<BurrowLocation[]> {
    return get("/burrows/map")
}

/**
 * Get the requesting user's schedule.
 */
export async function getSchedule(): Promise<ScheduleBurrowResponse[]> {
    return get("/burrows/schedule")
}

/**
 * Get the attendees of a Burrow.
 *
 * @param burrowID The ID of the Burrow to view attendees for.
 * @param page The page number.
 */
export async function getAttendees(
    burrowID: string,
    page: number = 1
): Promise<PaginatedResponse<BurrowMembershipResponse>> {
    return get(`/burrows/${burrowID}/attendees`, { query: { page } })
}

/**
 * Change the role of a member.
 *
 * @param burrowID The Burrow to adjust the role in.
 * @param userID The user to adjust the role of.
 * @param role The new role for the user.
 */
export async function changeRole(
    burrowID: string,
    userID: string,
    role: BurrowRole
): Promise<void> {
    return patch(`/burrows/${burrowID}/role`, { userID, role })
}

/**
 * Toggle the ban status on a member.
 *
 * @param burrowID The ID of the Burrow.
 * @param userID The ID of the user to ban or unban.
 */
export async function toggleBanMember(
    burrowID: string,
    userID: string
): Promise<void> {
    return patch(`/burrows/${burrowID}/status`, { userID })
}

/**
 * Bookmark a Burrow.
 *
 * @param id The Burrow to bookmark.
 */
export async function createBookmark(id: string): Promise<void> {
    return put(`/burrows/${id}/bookmark`)
}

/**
 * Remove a bookmark from a Burrow.
 *
 * @param id The Burrow to un-bookmark.
 */
export async function deleteBookmark(id: string): Promise<void> {
    return del(`/burrows/${id}/bookmark`)
}

/**
 * Get every Burrow the requesting user has bookmarked.
 */
export async function getBookmarks(): Promise<BurrowResponse[]> {
    return get("/burrows/bookmarks")
}

/**
 * Get the requesting user's Burrow history.
 *
 * @param page The page number.
 */
export async function getUserHistory(
    page: number = 1
): Promise<PaginatedResponse<BurrowResponse>> {
    return get("/user/history", { query: { page } })
}

/**
 * Get heatmap data showing Burrow counts by day.
 *
 * @param range The number of months to include.
 * @return Heatmap data mapping `YYYY-MM` to day counts.
 */
export async function getBurrowHeatmap(
    range: number = 1
): Promise<Record<string, Record<number, number>>> {
    return get("/burrows/heatmap", { query: { range } })
}

/**
 * Save the blocks enabled for a Burrow.
 *
 * @param burrowID The ID of the Burrow.
 * @param blocks The blocks that should be enabled, like `["CHAT"]`.
 */
export async function saveBlocks(
    burrowID: string,
    blocks: string[]
): Promise<void> {
    return patch(`/burrows/${burrowID}/block`, blocks)
}
