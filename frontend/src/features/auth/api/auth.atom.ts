import { atom } from "jotai"
import type { User } from "./user.types.ts"
import { atomWithCookie } from "@api/util.ts"

/**
 * The authorization token for the backend.
 */
export const authToken = atomWithCookie<string>("auth", "")

/**
 * The user's details.
 */
export const userDetails = atom<User | null>(null)

/**
 * If this user is a new user.
 */
export const newUser = atom<boolean>(false)
