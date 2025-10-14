import { useEffect, useRef } from "react"
import { BASE_URL } from "@api/util.ts"
import useToken from "@features/auth/api/hooks/useToken.ts"
import { useAtom } from "jotai"
import { blockStatus, syncStatus } from "@features/sync/api/sync.atom.ts"
import {
    type Response,
    SyncIncomingEvent,
    type SyncOutgoingEvent
} from "../api/sync.types.ts"

export default function useSync(meetingId: string) {
    const auth = useToken()

    const socketRef = useRef<WebSocket | null>(null)

    const [status, setStatus] = useAtom(syncStatus)
    const [, setBlocks] = useAtom(blockStatus)

    useEffect(() => {
        if (auth === null || auth === "") return

        const base = BASE_URL.replaceAll("https://", "wss://").replaceAll(
            "http://",
            "ws://"
        )
        const ws = new WebSocket(`${base}/groups/${meetingId}/sync`)

        socketRef.current = ws

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
        ws.onclose = () => setStatus("DISCONNECTED")

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
            ws.close()
            socketRef.current = null

            window.removeEventListener(
                "SYNC_OUTGOING",
                onSyncOutgoing as EventListener
            )
        }
    }, [auth, meetingId])

    return status
}
