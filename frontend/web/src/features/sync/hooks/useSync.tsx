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

/**
 * Sync to a Burrow.
 * This enables Chat and other meeting features.
 *
 * @param burrowID The ID of the Burrow.
 * @param isJoined If the user has joined the Burrow.
 */
export default function useSync(burrowID: string | null, isJoined: boolean) {
    const auth = useToken()

    const socketRef = useRef<WebSocket | null>(null)
    const connectedElsewhereRef = useRef(false)
    const reconnectTimeoutRef = useRef<number | null>(null)
    const shouldConnectRef = useRef(false)

    const setBlocks = useSetAtom(blockStatus)
    const [status, setStatus] = useAtom(syncStatus)
    const setRetry = useSetAtom(syncRetry)

    const WS_BASE = BASE_URL.replaceAll("http", "ws")

    useEffect(() => {
        if (auth === null || auth === "" || !burrowID || !isJoined) return

        shouldConnectRef.current = true

        function connectSync() {
            const ws = new WebSocket(`${WS_BASE}/burrows/${burrowID}/sync`)

            socketRef.current = ws

            setRetry("")
            setStatus("CONNECTING")
            connectedElsewhereRef.current = false

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
                                connectedElsewhereRef.current = true
                                setRetry("Connected elsewhere")
                                break
                        }

                        return
                    }

                    window.dispatchEvent(
                        new SyncIncomingEvent({
                            burrowID: burrowID ?? "",
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

                // don't retry if component unmounted or disconnecting intentionally
                if (!shouldConnectRef.current) {
                    return
                }

                // don't retry if they're connecting in multiple places
                if (connectedElsewhereRef.current) {
                    return
                }

                setRetry(`Attempting to reconnect...`)

                // retry connection after 10 seconds
                reconnectTimeoutRef.current = window.setTimeout(() => {
                    if ((socketRef.current?.readyState ?? 5) > WebSocket.OPEN) {
                        connectSync()
                    }
                }, 10_000)
            }
        }

        connectSync()

        return () => {
            // Prevent reconnection attempts after cleanup
            shouldConnectRef.current = false

            if (reconnectTimeoutRef.current !== null) {
                clearTimeout(reconnectTimeoutRef.current)
                reconnectTimeoutRef.current = null
            }

            if (socketRef.current) {
                socketRef.current.close()
                socketRef.current = null
            }
        }
    }, [WS_BASE, auth, burrowID, isJoined, setBlocks, setRetry, setStatus])

    useEffect(() => {
        const onSyncOutgoing = (event: SyncOutgoingEvent) => {
            const response = event.action

            if (!response) return

            const ws = socketRef.current

            if (ws && ws.readyState === WebSocket.OPEN)
                ws.send(
                    JSON.stringify({
                        block: response.block,
                        action: "EXECUTE_BLOCK",
                        data: {
                            ...response.data,
                            action: response.action
                        }
                    })
                )
        }

        window.addEventListener(
            "SYNC_OUTGOING",
            onSyncOutgoing as EventListener
        )

        return () => {
            window.removeEventListener(
                "SYNC_OUTGOING",
                onSyncOutgoing as EventListener
            )
        }
    }, [burrowID])

    return status
}
