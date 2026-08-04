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
export type SyncResponse = {
    burrowID: string
    block: string
    type: string
    payload: any
}

/**
 * An action sent to the Sync socket.
 */
export type SyncAction = {
    block: string
    action: string
    data: Record<string, string>
}

/**
 * The state of a Pomodoro timer.
 */
export type PomodoroState = {
    isActive: boolean
    isBreak: boolean
    remainingMs: number
    startedAt: number
    durationMs: number
}
