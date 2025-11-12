import type {
    BurrowType,
    BurrowVisibility
} from "@features/burrows/burrows.types.ts"

/**
 * The props for a {@link CreateBurrow} step.
 */
export type CreateStepProps = {
    errors: Record<string, string>
    formState: SubmittedBurrowFormState
    updateField: <K extends keyof SubmittedBurrowFormState>(
        field: K,
        value: SubmittedBurrowFormState[K]
    ) => void
}

/**
 * An in progress group state.
 */
export interface SubmittedBurrowFormState {
    title: string
    description: string
    location: string
    kind: BurrowType
    date: string
    beginningTime: string
    endTime: string
    tags: string
    capacity: number
    visibility: BurrowVisibility
    requestToJoin: boolean
}

/**
 * An empty group form state.
 */
export const initialFormState: SubmittedBurrowFormState = {
    title: "",
    description: "",
    location: "",
    kind: "STUDY",
    date: "",
    beginningTime: "",
    endTime: "",
    tags: "",
    capacity: 0,
    visibility: "PUBLIC",
    requestToJoin: false
}

/**
 * A group meeting created by a form.
 */
export type SubmittedBurrow = {
    title: string
    description: string
    location: string
    kind: BurrowType
    beginningTime: number // epoch millis
    endTime: number // epoch millis
    tags: string[]
    capacity: number
    visibility: BurrowVisibility
    requestToJoin: boolean
}
