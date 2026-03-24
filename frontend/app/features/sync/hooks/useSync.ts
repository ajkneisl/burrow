import { useEffect, useRef } from "react"
import { useAtom, useSetAtom } from "jotai"
import { authToken } from "@features/auth/auth.atom"
import { blockStatus, syncRetry, syncStatus } from "../sync.atom"
import { SyncIncomingEvent, type Response, type SyncOutgoingEvent } from "../sync.types"
import { eventBus } from "../eventBus"
import {BASE_URL} from "@api/util";

const WS_BASE_URL = (BASE_URL as string).replace("http", "ws")

/**
 * Sync to a Burrow.
 * This enables Chat and other burrow features via WebSocket.
 *
 * @param burrowID The ID of the Burrow
 * @param isJoined If the user has joined the Burrow
 */
export default function useSync(burrowID: string | null, isJoined: boolean) {
    const [auth] = useAtom(authToken)

    const socketRef = useRef<WebSocket | null>(null)
    const connectedElsewhereRef = useRef(false)
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const shouldConnectRef = useRef(false)

    const setBlocks = useSetAtom(blockStatus)
    const [status, setStatus] = useAtom(syncStatus)
    const setRetry = useSetAtom(syncRetry)

    useEffect(() => {
        const logPrefix = `[Sync: ${burrowID}]`

        console.log(`${logPrefix} Effect triggered`, {
            hasAuth: !!auth,
            authLength: auth?.length,
            burrowID,
            isJoined,
            WS_BASE_URL
        })

        if (!auth || auth === "" || !burrowID || !isJoined) {
            console.log(`${logPrefix} Skipping connection - missing requirements`)
            return
        }

        shouldConnectRef.current = true

        function connectSync() {
            const wsUrl = `${WS_BASE_URL}/burrows/${burrowID}/sync`
            console.log(`${logPrefix} Attempting to connect to:`, wsUrl)

            const ws = new WebSocket(wsUrl)

            socketRef.current = ws

            setRetry("")
            setStatus("CONNECTING")
            console.log(`${logPrefix} Status set to CONNECTING`)

            connectedElsewhereRef.current = false


            ws.onopen = () => {
                console.log(`${logPrefix} WebSocket connection opened`)
                setStatus("LIVE")
                console.log(`${logPrefix} Sending AUTHORIZE message with token`)

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
                console.log(`${logPrefix} Received message:`, ev.data)

                try {
                    const payload: Response = JSON.parse(ev.data as string)
                    const block = payload.block
                    console.log(`${logPrefix} Parsed message - block:`, block, "type:", payload.type)

                    if (block === "SYNC") {
                        switch (payload.type) {
                            case "BLOCKS":
                                console.log(`${logPrefix} Received BLOCKS:`, payload.payload)
                                setBlocks(payload.payload)
                                break
                            case "ALREADY_CONNECTED":
                                console.log(`${logPrefix} Already connected elsewhere`)
                                connectedElsewhereRef.current = true
                                setRetry("Connected elsewhere")
                                break
                        }

                        return
                    }

                    console.log(`${logPrefix} Dispatching event to eventBus:`, block)
                    eventBus.dispatchEvent(
                        new SyncIncomingEvent({
                            burrowID: burrowID ?? "",
                            block,
                            type: payload.type,
                            payload: payload.payload
                        })
                    )
                } catch (error) {
                    console.error(`${logPrefix} Error parsing message:`, error)
                }
            }

            ws.onerror = (error) => {
                console.error(`${logPrefix} WebSocket error:`, error)
                setStatus("ERROR")
            }
            ws.onclose = (event) => {
                console.log(`${logPrefix} WebSocket closed - code:`, event.code, "reason:", event.reason, "wasClean:", event.wasClean)
                setStatus("DISCONNECTED")

                // don't retry if component unmounted or disconnecting intentionally
                if (!shouldConnectRef.current) {
                    console.log(`${logPrefix} Not retrying - component unmounted`)
                    return
                }

                // don't retry if they're connecting in multiple places
                if (connectedElsewhereRef.current) {
                    console.log(`${logPrefix} Not retrying - connected elsewhere`)
                    return
                }

                console.log(`${logPrefix} Scheduling reconnection in 10 seconds...`)
                setRetry(`Attempting to reconnect...`)

                reconnectTimeoutRef.current = setTimeout(() => {
                    console.log(`${logPrefix} Attempting reconnection now`)
                    if (shouldConnectRef.current && (socketRef.current?.readyState ?? 5) > WebSocket.OPEN) {
                        connectSync()
                    }
                }, 10_000)
            }
        }

        console.log(`${logPrefix} Starting initial connection`)
        connectSync()

        return () => {
            console.log(`${logPrefix} Cleanup - closing connection`)
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
    }, [auth, burrowID, isJoined, setBlocks, setRetry, setStatus])

    useEffect(() => {
        const logPrefix = `[Sync: ${burrowID}]`
        console.log(`${logPrefix} Setting up outgoing event listener`)

        const onSyncOutgoing = (event: SyncOutgoingEvent) => {
            console.log(`${logPrefix} Outgoing event received:`, event.action)
            const response = event.action

            if (!response) {
                console.log(`${logPrefix} No response action, skipping`)
                return
            }

            const ws = socketRef.current

            if (ws && ws.readyState === WebSocket.OPEN) {
                const message = JSON.stringify({
                    block: response.block,
                    action: "EXECUTE_BLOCK",
                    data: {
                        ...response.data,
                        action: response.action
                    }
                })

                console.log(`${logPrefix} Sending message:`, message)
                ws.send(message)
            } else {
                console.log(`${logPrefix} Cannot send - WebSocket not open. State:`, ws?.readyState)
            }
        }

        eventBus.addEventListener("SYNC_OUTGOING", onSyncOutgoing)

        return () => {
            console.log(`${logPrefix} Removing outgoing event listener`)
            eventBus.removeEventListener("SYNC_OUTGOING", onSyncOutgoing)
        }
    }, [burrowID])

    return status
}
