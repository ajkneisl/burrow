import { useMemo } from "react"
import { Button, Card } from "@umnburrow/core"
import { useAtom } from "jotai"
import {
    settingsSaveLoading,
    settingsSection
} from "@features/sync/settings/settings.atom.ts"
import AccountSettings from "@features/sync/settings/components/AccountSettings.tsx"
import ThemeSettings from "@features/sync/settings/components/ThemeSettings.tsx"
import NotificationSettings from "@features/sync/settings/components/NotificationsSection.tsx"
import SettingsNavigationButton from "@features/sync/settings/components/SettingsNavigationButton.tsx"

/**
 * Settings page with side navigation.
 */
export default function SettingsView() {
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

        const formId =
            section === "Account"
                ? "account-form"
                : section === "Theme"
                  ? "theme-form"
                  : section === "Notifications"
                    ? "notifications-form"
                    : null

        if (formId) {
            const form = document.getElementById(formId) as HTMLFormElement

            if (form !== null) {
                form.requestSubmit()
            }
        }
    }

    return (
        <div className="flex min-h-screen flex-col">
            <div className="flex-1 py-8">
                <div className="mx-auto w-full px-4 md:max-w-4xl">
                    <h1 className="mb-8 text-3xl font-bold">Settings</h1>

                    <div className="flex flex-col gap-8 lg:flex-row">
                        {/* Sidebar navigation */}
                        <aside className="w-full flex-shrink-0 lg:w-56">
                            <nav>
                                <div className="flex flex-row gap-2 lg:flex-col">
                                    <SettingsNavigationButton
                                        name="Account"
                                        icon={
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
                                        }
                                    />

                                    <SettingsNavigationButton
                                        name="Notifications"
                                        icon={
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
                                        }
                                    />

                                    <SettingsNavigationButton
                                        name="Theme"
                                        icon={
                                            <svg
                                                width="18"
                                                height="18"
                                                viewBox="0 0 122.88 103.78"
                                                xmlns="http://www.w3.org/2000/svg"
                                            >
                                                <path
                                                    d="M0,103.78c11.7-8.38,30.46.62,37.83-14a16.66,16.66,0,0,0,.62-13.37,10.9,10.9,0,0,0-3.17-4.35,11.88,11.88,0,0,0-2.11-1.35c-9.63-4.78-19.67,1.91-25,10-4.9,7.43-7,16.71-8.18,23.07ZM54.09,43.42a54.31,54.31,0,0,1,15,18.06l50.19-49.16c3.17-3,5-5.53,2.3-10.13A6.5,6.5,0,0,0,117.41,0,7.09,7.09,0,0,0,112.8,1.6L54.09,43.42Zm-16.85,22c2.82,1.52,6.69,5.25,7.61,9.32L65.83,64c-3.78-7.54-8.61-14-15.23-18.58-6.9,9.27-5.5,11.17-13.36,20Z"
                                                    fill="currentColor"
                                                />
                                            </svg>
                                        }
                                    />
                                </div>
                            </nav>
                        </aside>

                        {/* Content area */}
                        <main className="w-full flex-1">{pane}</main>
                    </div>
                </div>
            </div>

            <div className="mx-2 border-card-border bg-background/95 sticky bottom-0 border-t backdrop-blur-sm">
                <div className="mx-auto w-full py-4 md:max-w-4xl">
                    <Card className="flex items-center justify-evenly gap-2">
                        <Button color="ERROR" onClick={() => {}}>
                            Delete Account
                        </Button>

                        <Button
                            onClick={submit}
                            color="SUCCESS"
                            loading={loading}
                        >
                            Save Changes
                        </Button>
                    </Card>
                </div>
            </div>
        </div>
    )
}
