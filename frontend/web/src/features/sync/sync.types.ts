export type Blocks = "POMODORO" | "CHAT" | "SYNC"

export type SyncStatus = "LIVE" | "DISCONNECTED" | "ERROR" | "CONNECTING"

export type Response = {
    burrowID: string;
    block: string;
    type: string;
    payload: any
}

export type Action = {
    block: string
    action: string
    data: Record<string, string>
}

export class SyncOutgoingEvent extends Event {
    static readonly NAME = "SYNC_OUTGOING"
    readonly action: Action

    constructor(action: Action) {
        super(SyncOutgoingEvent.NAME, { bubbles: true, composed: true })

        this.action = action
    }
}

export class SyncIncomingEvent extends Event {
    readonly response: Response

    constructor(response: Response) {
        super(`${response.block}_INCOMING`, { bubbles: true, composed: true })

        this.response = response
    }
}
