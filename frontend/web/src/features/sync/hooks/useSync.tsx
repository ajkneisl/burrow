import { useEffect, useRef } from "react"
import { BASE_URL } from "@api/util.ts"
import useToken from "@features/auth/hooks/useToken.ts"
import { useAtom, useSetAtom } from "jotai"
import { blockStatus, syncRetry, syncStatus } from "@features/sync/sync.atom.ts"
import {
    type Response,
    SyncIncomingEvent,
    type SyncOutgoingEvent
} from "../sync.types.ts"
import type { BurrowResponse } from "@features/burrows/burrows.types.tsx"

/**
 * Sync to a Burrow.
 * This enables Chat and other meeting features.
 *
 * @param meeting The meeting to sync with.
 */
export default function useSync(meeting?: BurrowResponse | null) {
    const auth = useToken()

    const burrowID = meeting?.burrow?.id
    const isJoined =
        meeting?.membership !== undefined &&
        meeting?.membership?.status !== "LEFT"

    const socketRef = useRef<WebSocket | null>(null)

    const [status, setStatus] = useAtom(syncStatus)
    const setBlocks = useSetAtom(blockStatus)
    const [retry, setRetry] = useAtom(syncRetry)

    const WS_BASE = BASE_URL.replaceAll("http", "ws")

    useEffect(() => {
        if (auth === null || auth === "" || !burrowID || !isJoined) return

        function connectSync() {
            const ws = new WebSocket(`${WS_BASE}/burrows/${burrowID}/sync`)

            socketRef.current = ws

            setRetry("")
            setStatus("CONNECTING")

            ws.onopen = () => {
                setStatus("LIVE")

                ws.send(
                    JSON.stringify({
                        block: "SYNC",
                        action: "AUTHORIZE",
                        data: {
                            token: auth
                        }
                    })
                )
            }

            ws.onmessage = (ev) => {
                try {
                    const payload: Response = JSON.parse(ev.data)
                    const block = payload.block

                    if (block === "SYNC") {
                        switch (payload.type) {
                            case "BLOCKS":
                                setBlocks(payload.payload)
                                break
                            case "ALREADY_CONNECTED":
                                setRetry("Connected elsewhere")
                                break
                        }

                        return
                    }

                    window.dispatchEvent(
                        new SyncIncomingEvent({
                            block,
                            type: payload.type,
                            payload: payload.payload
                        })
                    )
                } catch {
                    /* empty */
                }
            }

            ws.onerror = () => setStatus("ERROR")
            ws.onclose = () => {
                setStatus("DISCONNECTED")

                // don't retry if they're connecting in multiple places
                if (retry === "Connected elsewhere") {
                    return
                }

                setRetry(`Attempting to reconnect...`)

                // retry connection after 10 seconds
                setTimeout(() => {
                    connectSync()
                }, 10_000)
            }
        }

        connectSync()
    }, [WS_BASE, auth, burrowID, isJoined])

    useEffect(() => {
        const onSyncOutgoing = (event: SyncOutgoingEvent) => {
            const response = event.action

            if (!response) return

            const ws = socketRef.current

            if (ws && ws.readyState === WebSocket.OPEN)
                ws.send(JSON.stringify(response))
        }

        window.addEventListener(
            "SYNC_OUTGOING",
            onSyncOutgoing as EventListener
        )

        return () => {
            socketRef.current?.close()
            socketRef.current = null

            window.removeEventListener(
                "SYNC_OUTGOING",
                onSyncOutgoing as EventListener
            )
        }
    }, [auth, burrowID, isJoined])

    return status
}
