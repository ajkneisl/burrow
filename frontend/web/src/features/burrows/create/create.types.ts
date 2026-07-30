import {
    type BurrowKind,
    type BurrowVisibility,
    NOT_REOCCURRING
} from "@umnburrow/core/api"

/**
 * The form state backing the create/edit Burrow wizard. The submitted payloads
 * themselves ({@link SubmittedBurrow}) live in `@umnburrow/core/api`.
 */

/**
 * The props for a create Burrow step.
 */
export type CreateStepProps = {
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
 * Get the current time as HH:MM and one hour ahead (capped at 23:59).
 */
export function defaultTimes(): {
    date: string
    beginningTime: string
    endTime: string
} {
    const now = new Date()

    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, "0")
    const dd = String(now.getDate()).padStart(2, "0")
    const date = `${yyyy}-${mm}-${dd}`

    let startHour = now.getHours()
    let startMin: number

    if (now.getMinutes() === 0) {
        startMin = 0
    } else if (now.getMinutes() <= 30) {
        startMin = 30
    } else {
        startMin = 0
        startHour += 1
    }

    if (startHour >= 24) {
        return { date, beginningTime: "23:30", endTime: "23:59" }
    }

    const endHour = startHour + 1
    const endTime =
        endHour >= 24
            ? "23:59"
            : `${String(endHour).padStart(2, "0")}:${String(startMin).padStart(2, "0")}`

    return {
        date,
        beginningTime: `${String(startHour).padStart(2, "0")}:${String(startMin).padStart(2, "0")}`,
        endTime
    }
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
