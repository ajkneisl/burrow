import type { SyncAction, SyncResponse } from "@umnburrow/core/api"

export type {
    Blocks,
    PomodoroState,
    SyncStatus,
    SyncAction as Action,
    SyncResponse as Response
} from "@umnburrow/core/api"

/**
 * Custom event implementation for React Native, which has no DOM `Event`. The
 * payloads themselves live in `@umnburrow/core/api`.
 */
class CustomEvent {
    readonly type: string

    constructor(type: string) {
        this.type = type
    }
}

export class SyncOutgoingEvent extends CustomEvent {
    static readonly NAME = "SYNC_OUTGOING"
    readonly action: SyncAction

    constructor(action: SyncAction) {
        super(SyncOutgoingEvent.NAME)

        this.action = action
    }
}

export class SyncIncomingEvent extends CustomEvent {
    readonly response: SyncResponse

    constructor(response: SyncResponse) {
        super(`${response.block}_INCOMING`)

        this.response = response
    }
}
