import {
    type BurrowKind,
    type BurrowVisibility,
    NOT_REOCCURRING
} from "@features/burrows/burrows.types.tsx"

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
    kind: BurrowKind
    date: string
    beginningTime: string
    endTime: string
    tags: string
    capacity: number
    visibility: BurrowVisibility
    requestToJoin: boolean
    reoccurring: number
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
    requestToJoin: false,
    reoccurring: NOT_REOCCURRING
}

/**
 * A project burrow submission.
 */
export type SubmittedProjectBurrow = {
    kind: "PROJECT"
    name: string
    objective: string
    className: string
    teamMembers: string[] // array of user IDs
    dueDate: number // epoch millis
}

/**
 * A study/event burrow submission.
 */
export type SubmittedStudyEventBurrow = {
    kind: "STUDY" | "EVENT"
    title: string
    description: string
    location: string
    beginningTime: number // epoch millis
    endTime: number // epoch millis
    tags: string[]
    capacity: number
    visibility: BurrowVisibility
    requestToJoin: boolean
    reoccurring: number
}

/**
 * A group meeting created by a form - can be either project or study/event.
 */
export type SubmittedBurrow = SubmittedProjectBurrow | SubmittedStudyEventBurrow