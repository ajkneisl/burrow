import { del, get, patch, post } from "@api/api"
import type {
    Club,
    ClubResponse,
    MyClubResponse,
    SubmittedClub
} from "./club.types"

/**
 * Get the user's clubs.
 */
export async function getMyClubs(): Promise<MyClubResponse[]> {
    return await get("/clubs/mine")
}

/**
 * Create a new club.
 */
export async function createClub(data: SubmittedClub): Promise<Club> {
    return await post("/clubs", data)
}

/**
 * Get a club by its name.
 *
 * @param clubName The name of the club.
 */
export async function getClub(clubName: string): Promise<ClubResponse> {
    return await get(`/clubs/${clubName}`)
}

/**
 * Update a club.
 */
export async function updateClub(
    clubName: string,
    data: Partial<SubmittedClub>
): Promise<void> {
    return await patch(`/clubs/${clubName}`, data)
}

/**
 * Delete a club.
 *
 * @param clubName The name of the club to delete.
 */
export async function deleteClub(clubName: string): Promise<void> {
    return await del(`/clubs/${clubName}`)
}
