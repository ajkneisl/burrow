import { atomWithStorage } from "jotai/utils"

export const BASE_URL = import.meta.env.VITE_BASE_URL ?? ""

export const adminTokenAtom = atomWithStorage<string | null>("admin_token", null)