import { atom } from "jotai"
import type { BurrowKind } from "@features/burrows/burrows.types.ts"

export const createBurrowModal = atom<BurrowKind | null>(null)
