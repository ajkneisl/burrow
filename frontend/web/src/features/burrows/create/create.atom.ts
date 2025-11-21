import { atom } from "jotai"
import type { BurrowKind } from "@features/burrows/burrows.types.tsx"

export const createBurrowModal = atom<BurrowKind | null>(null)
