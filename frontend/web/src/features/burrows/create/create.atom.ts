import type { BurrowKind } from "@umnburrow/core/api"
import { atom } from "jotai"
export type CreateModalState = BurrowKind | "CLUB_EVENT" | null

export const createBurrowModal = atom<CreateModalState>(null)
export const selectedClubIDAtom = atom<string | null>(null)
