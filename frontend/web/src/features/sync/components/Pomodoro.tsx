import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button, Card } from "burrow-core"
import type { MeetingMembership } from "@features/groups/api/groups.types.ts"
import usePomodoroSync from "@features/sync/hooks/usePomodoroSync.tsx"
import { clamp, msToClock } from "@api/util.ts"

/**
 * {@see Pomodoro}
 */
type PomodoroProps = {
    meetingId?: string
    membership: MeetingMembership
}

/**
 * The pomodoro feature block on a meeting.
 *
 * @param meetingId The meeting ID.
 * @param membership The membership of the viewing user.
 */
export default function Pomodoro({ meetingId, membership }: PomodoroProps) {
    const { state, send } = usePomodoroSync(meetingId)

    const [now, setNow] = useState<number>(() => Date.now())
    const tickRef = useRef<number | null>(null)

    // maintain local state
    useEffect(() => {
        // run only while active
        if (!state.isActive || state.startedAt === 0) {
            if (tickRef.current) cancelAnimationFrame(tickRef.current)
            return
        }

        let raf: number
        const loop = () => {
            setNow(Date.now())
            raf = requestAnimationFrame(loop)
        }

        raf = requestAnimationFrame(loop)
        tickRef.current = raf

        return () => cancelAnimationFrame(raf)
    }, [state.isActive, state.startedAt])

    // compute optimistic remaining based on last server snapshot
    const optimisticRemaining = useMemo(() => {
        if (!state.isActive || state.startedAt === 0) return state.durationMs

        const elapsed = Math.max(0, now - state.startedAt)

        return Math.max(0, state.durationMs - elapsed)
    }, [state.isActive, state.startedAt, state.durationMs, now])

    const phaseLabel = state.isBreak ? "Break" : "Work"
    const totalMs = state.remainingMs || 1
    const progress = 100 - Math.floor((optimisticRemaining / totalMs) * 100)

    // actions
    const togglePhase = () => send("CHANGE_PHASE")
    const startTimer = () => send("START_TIMER")
    const endTimer = () => send("END_TIMER")
    const resetTimer = () => send("RESET_TIMER")
    const resync = useCallback(() => send("RETRIEVE_TIMER"), [send])

    // sync on load
    useEffect(() => {
        resync()
    }, [resync])

    return (
        <Card title="Pomodoro">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border ${state.isActive ? "bg-success/10 text-success border-success/20" : "bg-hero text-text/70 border-primary/10"}`}
                    >
                        {state.isActive ? "Active" : "Idle"}
                    </span>

                    <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border ${state.isBreak ? "bg-info/10 text-text border-info/20" : "bg-primary/10 text-text border-primary/20"}`}
                    >
                        {phaseLabel}
                    </span>
                </div>

                <Button thin color={"INFO"} onClick={resync}>
                    Resync
                </Button>
            </div>

            <div className="flex flex-col items-center">
                <div className="text-6xl font-bold tabular-nums tracking-tight select-none text-text">
                    {msToClock(optimisticRemaining)}
                </div>

                <div className="w-full mt-4">
                    <div className="h-2 rounded-full bg-hero/60 overflow-hidden">
                        <div
                            className="h-full bg-primary transition-[width] duration-300"
                            style={{ width: `${clamp(progress, 0, 100)}%` }}
                        />
                    </div>
                </div>

                <div className="text-xs text-text/60 mt-2">
                    {state.isActive
                        ? `Started ${new Date(state.startedAt).toLocaleTimeString()}`
                        : "Timer stopped"}
                </div>
            </div>

            {/* show buttons to moderators */}
            {membership.role !== "MEMBER" && (
                <>
                    <div className="flex flex-row justify-center items-center gap-2 mt-2">
                        <Button
                            color="INFO"
                            onClick={togglePhase}
                            disabled={state.isActive}
                        >
                            {state.isBreak ? "Work" : "Break"}
                        </Button>

                        <Button
                            color="SUCCESS"
                            onClick={() =>
                                state.isActive ? endTimer() : startTimer()
                            }
                        >
                            {state.isActive ? "End Timer" : "Start Timer"}
                        </Button>
                    </div>

                    <div className="flex flex-row justify-center mt-2 gap-2">
                        <Button thin color="ERROR" onClick={resetTimer}>
                            Reset
                        </Button>
                    </div>
                </>
            )}
        </Card>
    )
}
