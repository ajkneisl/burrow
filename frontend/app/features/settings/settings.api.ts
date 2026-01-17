import { get, post } from "@api/api"
import type {
    NotificationPreferences,
    GeneralSettings
} from "./settings.types"

/**
 * Get notification preferences for all notification kinds.
 *
 * @returns Array of notification preference configurations
 */
export async function getNotificationPreferences(): Promise<
    NotificationPreferences[]
> {
    return await get("/settings/notifications")
}

/**
 * Save notification preferences.
 *
 * @param preferences Array of notification preference configurations to save
 */
export async function saveNotificationPreferences(
    preferences: NotificationPreferences[]
): Promise<void> {
    await post("/settings/notifications", { preferences })
}

/**
 * Get general settings.
 *
 * @returns General settings including global notification toggle
 */
export async function getGeneralSettings(): Promise<GeneralSettings> {
    return await get("/settings/general")
}

/**
 * Save general settings.
 *
 * @param settings General settings to save
 */
export async function saveGeneralSettings(
    settings: GeneralSettings
): Promise<void> {
    await post("/settings/general", settings)
}

/**
 * Check if a specific delivery channel is enabled in the bitflag.
 *
 * @param deliveryChannels The bitflag value
 * @param channel The channel to check (PUSH_CHANNEL, EMAIL_CHANNEL, SSE_CHANNEL)
 * @returns Whether the channel is enabled
 */
export function isChannelEnabled(
    deliveryChannels: number,
    channel: number
): boolean {
    return (deliveryChannels & channel) !== 0
}

/**
 * Enable a delivery channel in the bitflag.
 *
 * @param deliveryChannels The current bitflag value
 * @param channel The channel to enable
 * @returns Updated bitflag value
 */
export function enableChannel(
    deliveryChannels: number,
    channel: number
): number {
    return deliveryChannels | channel
}

/**
 * Disable a delivery channel in the bitflag.
 *
 * @param deliveryChannels The current bitflag value
 * @param channel The channel to disable
 * @returns Updated bitflag value
 */
export function disableChannel(
    deliveryChannels: number,
    channel: number
): number {
    return deliveryChannels & ~channel
}
