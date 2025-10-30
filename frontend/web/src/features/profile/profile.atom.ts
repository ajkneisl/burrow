import { atom } from "jotai"
import type { Profile } from "@features/profile/profile.model.ts"

/**
 * If the user is currently editing.
 */
export const isEditingProfile = atom(false)

/**
 * The current edits to the profile.
 */
export const profileEdits = atom<Record<keyof Profile, string>>({
    bio: "",
    classes: "",
    gradYear: "",
    name: "",
    phoneNumber: "",
    userID: "",
    instagram: "",
    visibility: "Public"
})
