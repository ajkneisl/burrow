import type { SyncAction, SyncResponse } from "@umnburrow/core/api"

export type {
    Blocks,
    PomodoroState,
    SyncStatus,
    SyncAction as Action,
    SyncResponse as Response
} from "@umnburrow/core/api"

/**
 * The DOM events the web client uses to move sync traffic around. The payloads
 * themselves live in `@umnburrow/core/api`.
 */
export class SyncOutgoingEvent extends Event {
    static readonly NAME = "SYNC_OUTGOING"
    readonly action: SyncAction

    constructor(action: SyncAction) {
        super(SyncOutgoingEvent.NAME, { bubbles: true, composed: true })

        this.action = action
    }
}

export class SyncIncomingEvent extends Event {
    readonly response: SyncResponse

    constructor(response: SyncResponse) {
        super(`${response.block}_INCOMING`, { bubbles: true, composed: true })

        this.response = response
    }
}
