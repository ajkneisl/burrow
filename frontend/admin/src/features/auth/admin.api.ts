import type { Administrator, AdminLoginResponse } from "./admin.models.ts"
import { BASE_URL } from "./admin.atom.ts"

/**
 * Attempt to log in as an administrator.
 *
 * @param username The administrator username
 * @param password The administrator password
 * @param totp The time-based one-time password (2FA)
 */
export async function adminLogin(
    username: string,
    password: string,
    totp: string
): Promise<AdminLoginResponse> {
    const res = await fetch(`${BASE_URL}/admin`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password, totp }),
        credentials: "include"
    })

    if (!res.ok) {
        const msg = await res.text().catch(() => "Failed to log in")
        throw new Error(msg || "Login failed")
    }

    const data = await res.json()
    return {
        token: data.token,
        author: data.author as Administrator
    }
}

/**
 * Get the {@link Administrator} information.
 *
 * @param token The authorization token.
 */
export async function getAdmin(token: string): Promise<Administrator | null> {
    const res = await fetch(`${BASE_URL}/admin`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`
        }
    })

    if (!res.ok) {
        return Promise.reject("Failed to get administrator account.")
    }

    return await res.json()
}
