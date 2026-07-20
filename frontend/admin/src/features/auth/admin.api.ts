import type { AdminAccount, AuthorizedUser } from "./admin.models.ts"
import { BASE_URL } from "./admin.atom.ts"

/**
 * Log in with a Google credential using the main account login.
 *
 * @param credential The Google ID token from the sign-in flow.
 */
export async function loginWithGoogle(
    credential: string
): Promise<AuthorizedUser> {
    const res = await fetch(
        `${BASE_URL}/user/login?deviceName=${encodeURIComponent("Admin Panel")}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(credential)
        }
    )

    if (!res.ok) {
        const msg = await res.text().catch(() => "Failed to log in")
        throw new Error(msg || "Login failed")
    }

    return res.json()
}

/**
 * Exchange a refresh token for a new access token and rotated refresh token.
 *
 * @param refreshToken The current refresh token.
 */
export async function refreshSession(
    refreshToken: string
): Promise<{ token: string; refreshToken: string }> {
    const res = await fetch(`${BASE_URL}/user/refresh`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ refreshToken })
    })

    if (!res.ok) {
        throw new Error("Failed to refresh session")
    }

    return res.json()
}

/**
 * Get the {@link AdminAccount} information. Fails if the account is not an
 * administrator.
 *
 * @param token The authorization token.
 */
export async function getAdmin(token: string): Promise<AdminAccount | null> {
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
