import type {
    AuthorizedUser,
    DiscoveredUser,
    Relation
} from "@features/auth/user.types.ts"
import type { UserResponse, Profile } from "@features/profile/profile.model.ts"
import { del, get, post, put } from "@api/api"
import { BASE_URL } from "@api/util"

/**
 * Update a username.
 *
 * @param value The value to change the username to.
 */
export async function updateUsername(value: string) {
    return post("/user", {
        username: value
    })
}

/**
 * Retrieve user information.
 */
export async function getUser(): Promise<UserResponse> {
    return get("/user")
}

/**
 * Retrieve user information by username.
 *
 * @param username The username to lookup
 */
export async function getUserByUsername(
    username: string
): Promise<UserResponse> {
    return get(`/user/username/${username}`)
}

/**
 * Retrieve the token and user details when logging in.
 *
 * @param credentials Google credentials provided from login.
 * @param deviceName The device name for session tracking.
 */
export async function login(
    credentials: string,
    deviceName: string = "Mobile Device"
): Promise<AuthorizedUser> {
    return put("/user/login", credentials, {
        auth: false,
        query: { deviceName }
    })
}

/**
 * Login with an authorization code (for Android OAuth flow).
 * The backend exchanges the code for tokens.
 *
 * @param code The authorization code from Google OAuth
 * @param codeVerifier The PKCE code verifier
 * @param redirectUri The redirect URI used in the auth request
 * @param deviceName The device name for session tracking.
 */
export async function loginWithCode(
    code: string,
    codeVerifier: string,
    redirectUri: string,
    deviceName: string = "Mobile Device"
): Promise<AuthorizedUser> {
    return put(
        "/user/login",
        { code, codeVerifier, redirectUri },
        { auth: false, query: { platform: "android", deviceName } }
    )
}

/**
 * Alternative login with username and password.
 *
 * @param username The username
 * @param password The password
 * @param deviceName The device name for session tracking.
 */
export async function altLogin(
    username: string,
    password: string,
    deviceName: string = "Mobile Device"
): Promise<AuthorizedUser> {
    return put(
        "/user/altlogin",
        { username, password, deviceName },
        { auth: false }
    )
}

/**
 * Exchange a refresh token for a new access token and rotated refresh token.
 * Uses raw fetch to avoid the request() wrapper's auth logic.
 *
 * @param refreshToken The current refresh token.
 */
export async function refreshAccessToken(
    refreshToken: string
): Promise<{ token: string; refreshToken: string }> {
    const response = await fetch(`${BASE_URL}/user/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken })
    })

    if (!response.ok) throw new Error("Refresh failed")
    return response.json()
}

/**
 * Get all relations.
 *
 * @param key The type of relation to retrieve.
 * @param forUserID The user ID to search for
 */
export async function getRelations(
    key: string,
    forUserID?: string
): Promise<Relation[]> {
    return get(`/user/relations/${key}`, { query: { userID: forUserID } })
}

/**
 * Get discovered user suggestions.
 */
export async function getDiscoveredUsers(): Promise<DiscoveredUser[]> {
    return get("/user/relations/discover")
}

/**
 * Delete the current user's account.
 */
export async function deleteAccount(): Promise<void> {
    return del("/user")
}

/**
 * Save/update the user's profile information.
 *
 * @param profile Partial profile data to update
 */
export async function saveProfile(profile: Partial<Profile>): Promise<void> {
    return post("/user/profile", profile)
}

/**
 * Follow a user.
 *
 * @param userID The ID of the user to follow
 */
export async function followUser(userID: string): Promise<void> {
    return post("/user/relations/follow", undefined, { query: { userID } })
}

/**
 * Unfollow a user.
 *
 * @param userID The ID of the user to unfollow
 */
export async function unfollowUser(userID: string): Promise<void> {
    return del("/user/relations/follow", { query: { userID } })
}
