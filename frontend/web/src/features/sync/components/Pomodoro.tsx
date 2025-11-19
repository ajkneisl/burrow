import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button, Card } from "@umnburrow/core"
import type { BurrowMembership } from "@features/burrows/burrows.types.ts"
import usePomodoroSync from "@features/sync/hooks/usePomodoroSync.tsx"
import { msToClock } from "@api/util.ts"
import { PauseCircleIcon, PlayCircleIcon, RefreshCwIcon } from "lucide-react"

/**
 * {@see Pomodoro}
 */
type PomodoroProps = {
    burrowID?: string
    membership: BurrowMembership
}

/**
 * The pomodoro feature block on a Burrow.
 *
 * @param burrowID The Burrow ID.
 * @param membership The membership of the viewing user.
 */
export default function Pomodoro({ burrowID, membership }: PomodoroProps) {
    const { state, send } = usePomodoroSync(burrowID)

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
            <div className="flex flex-col items-center py-4">
                {/* phase indicator */}
                <div className="mb-6">
                    <div className="flex items-center justify-center gap-3">
                        <span
                            className={`rounded-full border-2 px-4 py-2 text-sm font-semibold transition-all duration-300 ${
                                state.isBreak
                                    ? "bg-info/20 text-info border-info/40 shadow-info/20 shadow-lg"
                                    : "bg-secondary/20 text-secondary border-secondary/40 shadow-secondary/20 shadow-lg"
                            }`}
                        >
                            {phaseLabel} Phase
                        </span>
                        <button
                            onClick={resync}
                            className="hover:bg-hero/60 text-text/60 hover:text-text rounded-full p-2 transition-colors"
                            title="Resync timer"
                        >
                            <RefreshCwIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* circular timer display */}
                <div className="relative mb-6">
                    {/* circular progress ring */}
                    <svg className="h-64 w-64 -rotate-90" viewBox="0 0 256 256">
                        {/* Background circle */}
                        <circle
                            cx="128"
                            cy="128"
                            r="112"
                            className="stroke-hero/40"
                            strokeWidth="12"
                            fill="none"
                        />

                        {/* Progress circle */}
                        <circle
                            cx="128"
                            cy="128"
                            r="112"
                            className={`transition-all duration-300 ${
                                state.isBreak
                                    ? "stroke-info"
                                    : "stroke-secondary"
                            }`}
                            strokeWidth="12"
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 112}`}
                            strokeDashoffset={`${2 * Math.PI * 112 * (1 - progress / 100)}`}
                            style={{
                                filter: state.isActive
                                    ? "drop-shadow(0 0 8px currentColor)"
                                    : "none"
                            }}
                        />
                    </svg>

                    {/* timer text centered in circle */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="text-text text-6xl font-bold tracking-tight tabular-nums select-none">
                            {msToClock(optimisticRemaining)}
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                            <div
                                className={`h-2 w-2 rounded-full transition-all duration-300 ${
                                    state.isActive
                                        ? "bg-success animate-pulse"
                                        : "bg-text/30"
                                }`}
                            />

                            <span className="text-text/60 text-sm font-medium">
                                {state.isActive ? "Active" : "Paused"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* status text */}
                <div className="text-text/50 mb-6 text-sm">
                    {state.isActive
                        ? `Started at ${new Date(state.startedAt).toLocaleTimeString()}`
                        : "Timer is stopped"}
                </div>

                {/* control buttons for moderators */}
                {membership.role !== "MEMBER" && (
                    <div className="w-full max-w-md space-y-3">
                        {/* primary action */}
                        <Button
                            color="SUCCESS"
                            onClick={() =>
                                state.isActive ? endTimer() : startTimer()
                            }
                            className="w-full py-3 text-base font-semibold"
                        >
                            {state.isActive ? (
                                <>
                                    <PauseCircleIcon className="h-4 w-4" />{" "}
                                    Pause Timer
                                </>
                            ) : (
                                <>
                                    <PlayCircleIcon className="h-4 w-4" /> Start
                                    Timer
                                </>
                            )}
                        </Button>

                        {/* secondary actions */}
                        <div className="flex gap-2">
                            <Button
                                color="INFO"
                                onClick={togglePhase}
                                disabled={state.isActive}
                                className="flex-1"
                            >
                                Switch to {state.isBreak ? "Work" : "Break"}
                            </Button>

                            <Button
                                thin
                                color="ERROR"
                                onClick={resetTimer}
                                className="px-6"
                            >
                                Reset
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    )
}
