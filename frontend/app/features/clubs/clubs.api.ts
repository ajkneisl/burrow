import { get, post } from "@api/api"
import type { Club, MyClubResponse, SubmittedClub } from "./club.types"

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
