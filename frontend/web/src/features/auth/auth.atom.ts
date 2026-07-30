import type { User } from "@umnburrow/core/api"
import { atom } from "jotai"
import { atomWithCookie } from "@api/util.ts"
/**
 * The authorization token for the backend.
 */
export const authToken = atomWithCookie<string>("auth", "")

/**
 * The refresh token for obtaining new access tokens.
 */
export const refreshTokenAtom = atomWithCookie<string>("refreshToken", "")

/**
 * The user's details.
 */
export const userDetails = atom<User | null>(null)

/**
 * If this user is a new user.
 */
export const newUser = atom<boolean>(false)
