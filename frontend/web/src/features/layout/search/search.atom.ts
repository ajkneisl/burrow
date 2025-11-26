import { atom } from "jotai"

/**
 * If the mobile search bar is open.
 */
export const mobileSearchOpenAtom = atom(false)

/**
 * The current search query.
 */
export const searchQueryAtom = atom("")