export type Blocks = "POMODORO" | "CHAT" | "SYNC"

export type SyncStatus = "LIVE" | "DISCONNECTED" | "ERROR" | "CONNECTING"

export type Response = {
    burrowID: string
    block: string
    type: string
    payload: any
}

export type Action = {
    block: string
    action: string
    data: Record<string, string>
}

/**
 * Custom event implementation for React Native.
 * Replaces DOM Event which doesn't exist in React Native.
 */
class CustomEvent {
    readonly type: string

    constructor(type: string) {
        this.type = type
    }
}

export class SyncOutgoingEvent extends CustomEvent {
    static readonly NAME = "SYNC_OUTGOING"
    readonly action: Action

    constructor(action: Action) {
        super(SyncOutgoingEvent.NAME)

        this.action = action
    }
}

export class SyncIncomingEvent extends CustomEvent {
    readonly response: Response

    constructor(response: Response) {
        super(`${response.block}_INCOMING`)

        this.response = response
    }
}
