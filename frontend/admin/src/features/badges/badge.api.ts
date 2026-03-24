import type { Badge } from "./badge.models.ts"
import { BASE_URL } from "../auth/admin.atom.ts"

/**
 * Get all badges.
 *
 * @param token The authorization token.
 */
export async function getBadges(token: string): Promise<Badge[]> {
    const res = await fetch(`${BASE_URL}/admin/badges`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })

    if (!res.ok) {
        const text = await res.text().catch(() => "")
        throw new Error(text || `Request failed with ${res.status}`)
    }

    return res.json()
}

/**
 * Create a badge.
 *
 * @param token The authorization token.
 * @param id The badge ID.
 * @param description The badge description.
 * @param image The badge image file.
 */
export async function createBadge(
    token: string,
    id: string,
    description: string,
    image: File
): Promise<void> {
    const res = await fetch(`${BASE_URL}/admin/badges/${id}`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": image.type,
            "X-Badge-Description": description
        },
        body: image
    })

    if (!res.ok) {
        const text = await res.text().catch(() => "")
        throw new Error(text || `Request failed with ${res.status}`)
    }
}

/**
 * Delete a badge.
 *
 * @param token The authorization token.
 * @param id The badge ID to delete.
 */
export async function deleteBadge(token: string, id: string): Promise<void> {
    const res = await fetch(`${BASE_URL}/admin/badges/${id}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`
        }
    })

    if (!res.ok) {
        const text = await res.text().catch(() => "")
        throw new Error(text || `Request failed with ${res.status}`)
    }
}

/**
 * Get a user's badges.
 *
 * @param token The authorization token.
 * @param userId The user ID.
 */
export async function getUserBadges(
    token: string,
    userId: string
): Promise<string[]> {
    const res = await fetch(`${BASE_URL}/admin/badges/user/${userId}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })

    if (!res.ok) {
        const text = await res.text().catch(() => "")
        throw new Error(text || `Request failed with ${res.status}`)
    }

    return res.json()
}

/**
 * Update a user's badges.
 *
 * @param token The authorization token.
 * @param userId The user ID.
 * @param badges The list of badge IDs to assign.
 */
export async function updateUserBadges(
    token: string,
    userId: string,
    badges: string[]
): Promise<void> {
    const res = await fetch(`${BASE_URL}/admin/badges/user/${userId}`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ badges })
    })

    if (!res.ok) {
        const text = await res.text().catch(() => "")
        throw new Error(text || `Request failed with ${res.status}`)
    }
}