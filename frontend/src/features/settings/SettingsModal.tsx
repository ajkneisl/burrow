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
                            Save
                        </Button>
                    </div>
                </div>
            }
        >
            <div className="flex h-full sm:flex-row flex-col items-start">
                <div
                    className={clsx(
                        "flex sm:flex-col flex-row gap-2 -mt-1 mb-3 p-1 mr-8"
                    )}
                >
                    <SettingsNavigationButton name="Account" icon={<p><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C7.86 14 4 17.13 4 21H20C20 17.13 16.14 14 12 14Z" fill="currentColor"/>
                    </svg></p>} />
                    <SettingsNavigationButton name="Notifications" icon={<p><svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z" fill="currentColor"/>
                    </svg></p>} />
                    <SettingsNavigationButton name="Theme" icon={<p> </p>}/>
                </div>

                <div className="flex min-h-80 flex-1 gap-4 flex-col">
                    {pane}
                </div>
            </div>
        </Modal>
    )
}
