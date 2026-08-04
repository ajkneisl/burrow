import type { User } from "@umnburrow/core/api"
import { atom } from "jotai"

import { atomWithAsyncStorage } from "@api/util"

/**
 * The authorization token for the backend.
 */
export const authToken = atomWithAsyncStorage<string>(
    "authToken",
    ""
)

/**
 * The refresh token for obtaining new access tokens.
 */
export const refreshTokenAtom = atomWithAsyncStorage<string>(
    "refreshToken",
    ""
)

/**
 * The user's details.
 */
export const userDetails = atom<User | null>(null)

/**
 * If this user is a new user.
 */
export const newUser = atom<boolean>(false)
