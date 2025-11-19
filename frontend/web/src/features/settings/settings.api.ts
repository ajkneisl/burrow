import { get, post } from "@api/api.ts"
import type { NotificationPreferences } from "@features/settings/settings.types.ts"

/**
 * Check if a channel is enabled in a user's delivery channels.
 *
 * @param deliveryChannels The user's channels.
 * @param channel The channel to check.
 */
export function isChannelEnabled(deliveryChannels: number, channel: number) {
    return (deliveryChannels & channel) !== 0
}

/**
 * Enable a channel in a user's channel preferences.
 *
 * @param deliveryChannels The channels to enable in.
 * @param channel The channel to enable.
 */
export function enableChannel(
    deliveryChannels: number,
    channel: number
): number {
    return deliveryChannels | channel
}

/**
 * Disable a channel in a user's channel preferences.
 *
 * @param deliveryChannels The channels to disable in.
 * @param channel The channel to disable.
 */
export function disableChannel(
    deliveryChannels: number,
    channel: number
): number {
    return deliveryChannels & ~channel
}

/**
 * Get notification preferences for the current user.
 *
 * @returns Array of notification preferences.
 */
export async function getNotificationPreferences(): Promise<
    NotificationPreferences[]
> {
    return await get("/settings/notifications")
}

/**
 * Save notification preferences.
 *
 * @param preferences Array of notification preferences to save.
 */
export async function saveNotificationPreferences(
    preferences: NotificationPreferences[]
): Promise<void> {
    return await post("/settings/notifications", { preferences })
}

/**
 * Get general settings for the current user.
 *
 * @returns General settings including global notification toggle and default delivery channels.
 */
export async function getGeneralSettings(): Promise<{
    notificationsEnabled: boolean
    defaultNotificationDelivery: number
}> {
    return await get("/settings/general")
}

/**
 * Save general settings for the current user.
 *
 * @param settings General settings to save.
 */
export async function saveGeneralSettings(settings: {
    notificationsEnabled: boolean
    defaultNotificationDelivery: number
}): Promise<void> {
    return await post("/settings/general", settings)
}
