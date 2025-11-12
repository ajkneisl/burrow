import { atom } from "jotai"
import type { Profile, RelationView } from "@features/profile/profile.model.ts"

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
    linkedIn: "",
    visibility: "Public",
    major: "",
    school: ""
})

/**
 * The errors when attempting to save the profile.
 */
export const profileEditErrors = atom<string[]>([])

/**
 * If the relations modal is visible.
 *
 * @see ViewRelations
 */
export const isRelationsVisible = atom(false)

/**
 * The type of relation to view on the relations modal.
 *
 * @see ViewRelations
 */
export const relationType = atom<RelationView | null>(null)
