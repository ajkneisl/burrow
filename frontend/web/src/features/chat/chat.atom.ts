import { atom } from "jotai"

export const chatSocket = atom<WebSocket | null>(null)
