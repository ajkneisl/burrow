import type { AccountType, AdminAccount } from "../auth/admin.models.ts"
import { BASE_URL } from "../auth/admin.atom.ts"

/**
 * Get all administrator accounts.
 *
 * @param token The authorization token.
 */
export async function getAdminAccounts(token: string): Promise<AdminAccount[]> {
    const res = await fetch(`${BASE_URL}/admin/accounts`, {
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
 * Change a user's account type.
 *
 * @param token The authorization token.
 * @param userId The ID of the user to change.
 * @param accountType The new account type.
 */
export async function setAccountType(
    token: string,
    userId: string,
    accountType: AccountType
): Promise<void> {
    const res = await fetch(`${BASE_URL}/admin/accounts/${userId}`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ accountType })
    })

    if (!res.ok) {
        const text = await res.text().catch(() => "")
        throw new Error(text || `Request failed with ${res.status}`)
    }
}
