

export const BASE_URL = import.meta.env.VITE_BASE_URL ?? ""

export type Administrator = {
    id: string
    username: string
    email: string
    permissionBits: number
    createdAt: number
    lastLoginAt: number | null
    lastLoginIp: string | null
    passwordUpdatedAt: number
}

export type AdminLoginResponse = {
    token: string
    author: Administrator
}

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
    totp: string,
): Promise<AdminLoginResponse> {
    const res = await fetch(`${BASE_URL}/admin`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password, totp }),
        credentials: "include",
    })

    if (!res.ok) {
        const msg = await res.text().catch(() => "Failed to log in")
        throw new Error(msg || "Login failed")
    }

    const data = await res.json()
    return {
        token: data.token,
        author: data.author as Administrator,
    }
}