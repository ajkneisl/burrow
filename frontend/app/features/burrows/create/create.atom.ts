import { atom } from "jotai"
import type { BurrowType } from "@features/burrows/burrows.types"
import { initialFormState, type SubmittedBurrowFormState } from "./create.types"

/**
 * Atom for tracking the current step in the wizard (1-3)
 */
export const wizardStepAtom = atom(1)

/**
 * Atom for storing the burrow form data
 */
export const formDataAtom = atom<SubmittedBurrowFormState>(initialFormState)

/**
 * Atom for storing the selected burrow type
 */
export const selectedBurrowTypeAtom = atom<BurrowType | null>(null)

/**
 * Atom for storing form errors
 */
export const formErrorsAtom = atom<Record<string, string>>({})

/**
 * Atom for tracking if wizard is visible
 */
export const wizardVisibleAtom = atom(false)
