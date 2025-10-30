import { atom } from "jotai"
import type { Notification } from "@features/notifications/notifications.types.ts"

export const notificationsAtom = atom<Notification[]>([])
