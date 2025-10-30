import { useMemo } from "react"
import { Button, Modal } from "@umnburrow/core"
import { useAtom } from "jotai"
import {
    settingsModalOpen,
    settingsSaveLoading,
    settingsSection
} from "@features/sync/settings/settings.atom.ts"
import clsx from "clsx"
import AccountSettings from "@features/sync/settings/components/AccountSettings.tsx"
import ThemeSettings from "@features/sync/settings/components/ThemeSettings.tsx"
import NotificationSettings from "@features/sync/settings/components/NotificationsSection.tsx"
import SettingsNavigationButton from "@features/sync/settings/components/SettingsNavigationButton.tsx"

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
                    <Button>
                        Delete my Account

                        <svg
                            width="18px"
                            height="18px"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="var(--text-color)"
                        >
                            <path d="M5.12817 8.15391C5.12817 10.4103 5.12817 13.5898 5.12817 15.1283C5.23074 16.4616 5.3333 18.2052 5.43587 19.436C5.53843 20.8719 6.7692 22.0001 8.2051 22.0001H15.7948C17.2307 22.0001 18.4615 20.8719 18.5641 19.436C18.6666 18.2052 18.7692 16.4616 18.8718 15.1283C18.9743 13.5898 18.8718 10.4103 18.8718 8.15391H5.12817Z" />
                            <path d="M19.1795 5.07698H16.6154L15.7949 3.53852C15.2821 2.61545 14.359 2.00006 13.3333 2.00006H10.8718C9.84615 2.00006 8.82051 2.61545 8.41026 3.53852L7.38462 5.07698H4.82051C4.41026 5.07698 4 5.48724 4 5.8975C4 6.30775 4.41026 6.71801 4.82051 6.71801H19.1795C19.5897 6.71801 20 6.41032 20 5.8975C20 5.38468 19.5897 5.07698 19.1795 5.07698ZM9.12821 5.07698L9.64103 4.25647C9.84615 3.84621 10.2564 3.53852 10.7692 3.53852H13.2308C13.7436 3.53852 14.1538 3.74365 14.359 4.25647L14.8718 5.07698H9.12821Z" />
                        </svg>
                    </Button>

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
                    <SettingsNavigationButton
                        name="Account"
                        icon={
                            <p>
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C7.86 14 4 17.13 4 21H20C20 17.13 16.14 14 12 14Z"
                                        fill="currentColor"
                                    />
                                </svg>
                            </p>
                        }
                    />

                    <SettingsNavigationButton
                        name="Notifications"
                        icon={
                            <p>
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z"
                                        fill="currentColor"
                                    />
                                </svg>
                            </p>
                        }
                    />

                    <SettingsNavigationButton
                        name="Theme"
                        icon={
                            <p>
                                <svg
                                    width="18"
                                    height="18"
                                    id="Layer_1"
                                    data-name="Layer 1"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 122.88 103.78"
                                >
                                    <path
                                        d="M0,103.78c11.7-8.38,30.46.62,37.83-14a16.66,16.66,0,0,0,.62-13.37,10.9,10.9,0,0,0-3.17-4.35,11.88,11.88,0,0,0-2.11-1.35c-9.63-4.78-19.67,1.91-25,10-4.9,7.43-7,16.71-8.18,23.07ZM54.09,43.42a54.31,54.31,0,0,1,15,18.06l50.19-49.16c3.17-3,5-5.53,2.3-10.13A6.5,6.5,0,0,0,117.41,0,7.09,7.09,0,0,0,112.8,1.6L54.09,43.42Zm-16.85,22c2.82,1.52,6.69,5.25,7.61,9.32L65.83,64c-3.78-7.54-8.61-14-15.23-18.58-6.9,9.27-5.5,11.17-13.36,20Z"
                                        fill="currentColor"
                                    />
                                </svg>
                            </p>
                        }
                    />
                </div>

                <div className="flex min-h-80 flex-1 gap-4 flex-col">
                    {pane}
                </div>
            </div>
        </Modal>
    )
}
