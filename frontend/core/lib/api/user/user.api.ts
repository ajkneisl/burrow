import { del, get, post, put, request, type RawBody } from "../client"
import { getBaseUrl } from "../config"
import type {
    AuthorizedUser,
    BlockedUserInfo,
    DiscoveredUser,
    Profile,
    RefreshedSession,
    Relation,
    UserResponse
} from "./user.models"

/**
 * Retrieve the token and user details when logging in with Google.
 *
 * @param credentials Google credentials provided from login.
 * @param deviceName The device name for session tracking.
 */
export async function login(
    credentials: string,
    deviceName: string
): Promise<AuthorizedUser> {
    return put("/user/login", credentials, {
        auth: false,
        query: { deviceName }
    })
}

/**
 * Login with an authorization code, used by the Android OAuth flow. The
 * backend exchanges the code for tokens.
 *
 * @param code The authorization code from Google OAuth.
 * @param codeVerifier The PKCE code verifier.
 * @param redirectUri The redirect URI used in the auth request.
 * @param deviceName The device name for session tracking.
 */
export async function loginWithCode(
    code: string,
    codeVerifier: string,
    redirectUri: string,
    deviceName: string
): Promise<AuthorizedUser> {
    return put(
        "/user/login",
        { code, codeVerifier, redirectUri },
        { auth: false, query: { platform: "android", deviceName } }
    )
}

/**
 * Alternative login with a username and password.
 *
 * @param username The username.
 * @param password The password.
 * @param deviceName The device name for session tracking.
 */
export async function altLogin(
    username: string,
    password: string,
    deviceName: string
): Promise<AuthorizedUser> {
    return put(
        "/user/altlogin",
        { username, password, deviceName },
        { auth: false }
    )
}

/**
 * Exchange a refresh token for a new access token and rotated refresh token.
 * Uses raw fetch to avoid the request wrapper's auth handling.
 *
 * @param refreshToken The current refresh token.
 */
export async function refreshAccessToken(
    refreshToken: string
): Promise<RefreshedSession> {
    const response = await fetch(`${getBaseUrl()}/user/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken })
    })

    if (!response.ok) throw new Error("Refresh failed")

    return response.json()
}

/**
 * Retrieve the requesting user's information.
 */
export async function getUser(): Promise<UserResponse> {
    return get("/user")
}

/**
 * Retrieve a user by their username.
 *
 * @param username The username to look up.
 */
export async function getUserByUsername(
    username: string
): Promise<UserResponse> {
    return get(`/user/username/${username}`)
}

/**
 * Retrieve a user by their ID.
 *
 * @param userID The ID of the user.
 */
export async function getUserByID(userID: string): Promise<UserResponse> {
    return get(`/user/id/${userID}`)
}

/**
 * Update the requesting user's username.
 *
 * @param value The value to change the username to.
 */
export async function updateUsername(value: string): Promise<void> {
    return post("/user", { username: value })
}

/**
 * Save the requesting user's profile.
 *
 * @param profile The attributes of the profile to update.
 */
export async function saveProfile(profile: Partial<Profile>): Promise<void> {
    return post("/user/profile", profile)
}

/**
 * Delete the requesting user's account.
 */
export async function deleteAccount(): Promise<void> {
    return del("/user")
}

/**
 * Get all relations of a given kind.
 *
 * @param key The type of relation to retrieve — `friends`, `following` or
 *   `followers`.
 * @param forUserID The user to retrieve relations for, defaulting to the
 *   requesting user.
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
 * Follow a user.
 *
 * @param userID The user to follow.
 */
export async function followUser(userID: string): Promise<void> {
    return post("/user/relations/follow", undefined, { query: { userID } })
}

/**
 * Unfollow a user.
 *
 * @param userID The user to unfollow.
 */
export async function unfollowUser(userID: string): Promise<void> {
    return del("/user/relations/follow", { query: { userID } })
}

/**
 * Upload a new profile picture for the requesting user.
 *
 * @param file The photo.
 * @param contentType The MIME type of the photo.
 */
export async function uploadUserPhoto(
    file: RawBody,
    contentType: string
): Promise<void> {
    return request("POST", "/user/photo", { data: file, contentType })
}

/**
 * Get the users the requesting user has blocked.
 */
export async function getBlockedUsers(): Promise<BlockedUserInfo[]> {
    return get("/user/block")
}

/**
 * Block a user.
 *
 * @param userID The ID of the user to block.
 */
export async function blockUser(userID: string): Promise<void> {
    return put("/user/block", undefined, { query: { userID } })
}

/**
 * Unblock a user.
 *
 * @param userID The ID of the user to unblock.
 */
export async function unblockUser(userID: string): Promise<void> {
    return del("/user/block", { query: { userID } })
}
