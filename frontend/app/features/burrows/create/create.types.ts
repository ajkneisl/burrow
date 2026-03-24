import type {
    BurrowKind,
    BurrowVisibility
} from "@features/burrows/burrows.types"
import { NOT_REOCCURRING } from "@features/burrows/burrows.types"

/**
 * The props for a CreateBurrow step component.
 */
export type CreateStepProps = {
    errors: Record<string, string>
    formState: SubmittedBurrowFormState
    updateField: <K extends keyof SubmittedBurrowFormState>(
        field: K,
        value: SubmittedBurrowFormState[K]
    ) => void
    isEditMode?: boolean
}

/**
 * An in-progress burrow form state.
 */
export interface SubmittedBurrowFormState {
    title: string
    description: string
    location: string
    kind: BurrowKind
    date: Date | null
    beginningTime: Date | null
    endTime: Date | null
    tags: string
    capacity: number
    visibility: BurrowVisibility
    requestToJoin: boolean
    reoccurring: number
    // Project-specific fields
    name: string
    objective: string
    className: string
    teamMembers: string[] // array of user IDs
    dueDate: Date | null
    // Club burrow field
    clubID: string
}

/**
 * An empty group form state.
 */
export const initialFormState: SubmittedBurrowFormState = {
    title: "",
    description: "",
    location: "",
    kind: "STUDY",
    date: null,
    beginningTime: null,
    endTime: null,
    tags: "",
    capacity: 0,
    visibility: "PUBLIC",
    requestToJoin: false,
    reoccurring: NOT_REOCCURRING,
    name: "",
    objective: "",
    className: "",
    teamMembers: [],
    dueDate: null,
    clubID: ""
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
 * A study/event/club burrow submission.
 */
export type SubmittedStudyEventBurrow = {
    kind: "STUDY" | "EVENT" | "CLUB"
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
    clubID?: string
}

/**
 * A burrow created by a form - can be either project or study/event/club.
 */
export type SubmittedBurrow = SubmittedProjectBurrow | SubmittedStudyEventBurrow
