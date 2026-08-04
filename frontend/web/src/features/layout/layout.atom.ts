import { atom } from "jotai"
import { defaultMetaTags, type MetaTagsState } from "@features/layout/layout.type.ts"
/**
 * The current page meta state.
 */
export const metaTagsAtom = atom<MetaTagsState>(defaultMetaTags)

/**
 * Atom to control the My Invites modal visibility.
 */
export const myInvitesModalOpen = atom(false)
