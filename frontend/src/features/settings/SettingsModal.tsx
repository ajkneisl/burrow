import { useMemo } from "react"
import Button from "@components/Button.tsx"
import { useAtom } from "jotai"
import Modal from "@components/Modal.tsx"
import {
    settingsModalOpen,
    settingsSaveLoading,
    settingsSection
} from "@features/settings/api/settings.atom.ts"
import clsx from "clsx"
import AccountSettings from "@features/settings/components/AccountSettings.tsx"
import ThemeSettings from "@features/settings/components/ThemeSettings.tsx"
import NotificationSettings from "@features/settings/components/NotificationsSection.tsx"
import SettingsNavigationButton from "@features/settings/components/SettingsNavigationButton.tsx"

/**
 * Settings modal with side navigation.
 */
export default function SettingsModal() {
    const [open, setOpen] = useAtom(settingsModalOpen)
    const [section] = useAtom(settingsSection)
    const [loading, setLoading] = useAtom(settingsSaveLoading)

    const pane = useMemo(() => {
        switch (section) {
            case "Account":
                return <AccountSettings />
            case "Notifications":
                return <NotificationSettings />
            case "Theme":
                return <ThemeSettings />
            default:
                return <></>
        }
    }, [section])

    function submit() {
        setLoading(true)

        // TODO: this will be chosen based on what sections open in the future
        const preferencesForm = document.getElementById(
            "account-form"
        ) as HTMLFormElement

        if (preferencesForm !== null) {
            preferencesForm.requestSubmit()
        }
    }

    return (
        <Modal
            open={open}
            onClose={() => setOpen(false)}
            title="Settings"
            widthClass="max-w-3xl"
            footer={
                <div className="w-full flex items-center justify-between">
                    <Button>Delete my Account</Button>

                    <div className="flex items-center gap-2">
                        <Button
                            color="ERROR"
                            type="button"
                            onClick={() => setOpen(false)}
                        >
                            Close
                        </Button>

                        <Button
                            onClick={submit}
                            color="SUCCESS"
                            loading={loading}
                        >
                            Save Preferences
                        </Button>
                    </div>
                </div>
            }
        >
            <div className="flex h-full sm:flex-row flex-col items-start">
                {/* Mobile top nav */}
                <div
                    className={clsx(
                        "flex sm:flex-col flex-row gap-4 -mt-1 mb-3 p-1 mr-8"
                    )}
                >
                    <SettingsNavigationButton name="Account" />
                    <SettingsNavigationButton name="Notifications" />
                    <SettingsNavigationButton name="Theme" />
                </div>

                <div className="flex min-h-80 flex-1 gap-4 flex-col">
                    {pane}
                </div>
            </div>
        </Modal>
    )
}
