import type { PomodoroState } from "@umnburrow/core/api"
import { useCallback, useEffect, useState } from "react"
import { type SyncIncomingEvent, SyncOutgoingEvent } from "@features/sync/sync.types"

import { eventBus } from "../eventBus"

/**
 * Sync the Pomodoro state via window events.
 *
 * @param burrowId The ID of the burrow to sync for.
 */
export function usePomodoroSync(burrowId?: string) {
    const [state, setState] = useState<PomodoroState>({
        isActive: false,
        isBreak: false,
        durationMs: 25 * 60_000, // 25 minutes (standard Pomodoro)
        startedAt: 0,
        remainingMs: 25 * 60_000
    })

    // Listen for incoming events
    useEffect(() => {
        function onState(event: any) {
            const syncEvent = event as SyncIncomingEvent
            const payload = syncEvent.response

            switch (payload.type) {
                case "STATE":
                    setState(payload.payload)
                    break
            }
        }

        eventBus.addEventListener("POMODORO_INCOMING", onState)

        return () => {
            eventBus.removeEventListener("POMODORO_INCOMING", onState)
        }
    }, [burrowId])

    const send = useCallback((action: string, data?: any) => {
        const evt = new SyncOutgoingEvent({
            block: "POMODORO",
            action,
            data: data ?? {}
        })

        eventBus.dispatchEvent(evt)
    }, [])

    return { state, send } as const
}
