import { atom } from "jotai"
import type { BurrowKind } from "@features/burrows/burrows.types.tsx"

export type CreateModalState = BurrowKind | "CLUB_EVENT" | null

export const createBurrowModal = atom<CreateModalState>(null)
