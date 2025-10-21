import { atom } from "jotai"

/**
 * If the settings modal is open.
 *
 * @see SettingsModal
 */
export const settingsModalOpen = atom(false)

/**
 * If the `Save Preferences` button on the bottom of the settings modal is loading.
 *
 * @see Settings Modal
 */
export const settingsSaveLoading = atom(false)

/**
 * The current section on the settings modal.
 *
 * @see SettingsModal
 */
export const settingsSection = atom("Account")
