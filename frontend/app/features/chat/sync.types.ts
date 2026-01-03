/**
 * The different types of blocks for a Burrow sync.
 */
export type Blocks = "POMODORO" | "CHAT" | "SYNC"

/**
 * The status of the socket.
 */
export type SyncStatus = "LIVE" | "DISCONNECTED" | "ERROR" | "CONNECTING"

/**
 * A response from the Sync socket.
 */
export type Response = {
    burrowID: string
    block: string
    type: string
    payload: any
}

/**
 * A sent action to the Sync socket.
 */
export type Action = {
    block: string
    action: string
    data: Record<string, string>
}
