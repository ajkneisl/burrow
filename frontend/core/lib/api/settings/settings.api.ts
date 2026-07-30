import { get, post } from "../client"
import type {
    GeneralSettings,
    NotificationPreferences,
    Theme
} from "./settings.models"

/**
 * Get notification preferences for the requesting user.
 */
export async function getNotificationPreferences(): Promise<
    NotificationPreferences[]
> {
    return get("/settings/notifications")
}

/**
 * Save notification preferences.
 *
 * @param preferences The preferences to save.
 */
export async function saveNotificationPreferences(
    preferences: NotificationPreferences[]
): Promise<void> {
    return post("/settings/notifications", { preferences })
}

/**
 * Get general settings for the requesting user.
 */
export async function getGeneralSettings(): Promise<GeneralSettings> {
    return get("/settings/general")
}

/**
 * Save general settings for the requesting user.
 *
 * @param settings The settings to save.
 */
export async function saveGeneralSettings(
    settings: GeneralSettings
): Promise<void> {
    return post("/settings/general", settings)
}

/**
 * Retrieve the user's saved theme.
 */
export async function getTheme(): Promise<Theme> {
    const response = await get<{ theme: Theme }>("/settings/theme")

    return response.theme
}

/**
 * Save a theme.
 *
 * @param theme The theme to save.
 */
export async function saveTheme(theme: Theme): Promise<void> {
    return post("/settings/theme", theme)
}

/**
 * Check if a channel is enabled in a user's delivery channels.
 *
 * @param deliveryChannels The user's channels.
 * @param channel The channel to check.
 */
export function isChannelEnabled(
    deliveryChannels: number,
    channel: number
): boolean {
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
