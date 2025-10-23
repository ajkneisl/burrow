import { atom } from "jotai"
import type { Notification } from "@features/notifications/api/notifications.types.ts"

export const notificationsAtom = atom<Notification[]>([])
