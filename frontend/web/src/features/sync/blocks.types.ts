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
