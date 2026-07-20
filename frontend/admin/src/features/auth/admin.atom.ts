import { atomWithStorage } from "jotai/utils"

export const BASE_URL = import.meta.env.VITE_BASE_URL ?? ""
export const CDN_URL = import.meta.env.VITE_CDN_URL ?? ""

export const adminTokenAtom = atomWithStorage<string | null>("admin_token", null)

export const adminRefreshTokenAtom = atomWithStorage<string | null>(
    "admin_refresh_token",
    null
)
