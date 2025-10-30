import { useCallback, useEffect, useState } from "react"
import {
    type SyncIncomingEvent,
    SyncOutgoingEvent
} from "@features/sync/sync.types.ts"
import type { PomodoroState } from "@features/sync/blocks.types.ts"

/**
 * Sync the Pomodoro state.
 *
 * @param meetingId The ID of the meeting to sync for.
 */
export default function usePomodoroSync(meetingId?: string) {
    const [state, setState] = useState<PomodoroState>({
        isActive: false,
        isBreak: false,
        durationMs: 20 * 60_000, // 20 mimutes
        startedAt: 0,
        remainingMs: 0
    })

    // listen for events
    useEffect(() => {
        function onState(event: SyncIncomingEvent) {
            const payload = event.response

            switch (payload.type) {
                case "STATE":
                    setState(payload.payload)
                    break
            }
        }

        window.addEventListener("POMODORO_INCOMING", onState as EventListener)

        return () =>
            window.removeEventListener(
                "POMODORO_INCOMING",
                onState as EventListener
            )
    }, [meetingId])

    const send = useCallback((action: string, data?: any) => {
        const evt = new SyncOutgoingEvent({
            block: "POMODORO",
            action,
            data: data ?? {}
        })

        window.dispatchEvent(evt)
    }, [])

    return { state, send } as const
}
