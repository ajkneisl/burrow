import { atom } from "jotai"

/**
 * Controls the search modal visibility
 */
export const searchModalOpen = atom<boolean>(false)

/**
 * Controls the create Burrow modal visibility
 */
export const createModalOpen = atom<boolean>(false)
