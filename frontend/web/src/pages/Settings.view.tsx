
import { Button, Card } from "@umnburrow/core"
import { useAtom } from "jotai"
import {
    settingsSaveLoading,
    settingsSection
} from "@features/settings/settings.atom.ts"
import AccountSection from "@features/settings/components/AccountSection.tsx"
import ThemeSection from "@features/settings/components/ThemeSection.tsx"
import NotificationsSection from "@features/settings/components/NotificationsSection.tsx"
import SettingsNavigationButton from "@features/settings/components/SettingsNavigationButton.tsx"
// @ts-ignore
import { Bell, Palette, User } from "lucide-react"
import { useMemo } from "react"

/**
 * The settings page.
 *
 * @see AccountSection
 * @see ThemeSection
 * @see NotificationsSection
 *
 * @author AJ Kneisl
 */
export default function SettingsView() {
    const [section] = useAtom(settingsSection)
    const [loading, setLoading] = useAtom(settingsSaveLoading)

    // which type of settings to see
    const pane = useMemo(() => {
        switch (section) {
            case "Account":
                return <AccountSection />
            case "Notifications":
                return <NotificationsSection />
            case "Theme":
                return <ThemeSection />
            default:
                return <></>
        }
    }, [section])

    // attempt to submit the curent pane
    function submit() {
        setLoading(true)

        let formID: string | undefined

        switch (section) {
            case "Account":
                formID = "account-form"
                break
            case "Notifications":
                formID = "notifications-form"
                break
            case "Theme":
                formID = "theme-form"
                break
        }

        if (formID) {
            const form = document.getElementById(formID) as HTMLFormElement

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
                        {/* navigation */}
                        <aside className="w-full flex-shrink-0 lg:w-56">
                            <nav>
                                <div className="flex flex-row gap-2 lg:flex-col">
                                    <SettingsNavigationButton
                                        name="Account"
                                        icon={<User width="18" height="18" />}
                                    />

                                    <SettingsNavigationButton
                                        name="Notifications"
                                        icon={<Bell width="18" height="18" />}
                                    />

                                    <SettingsNavigationButton
                                        name="Theme"
                                        icon={<Palette width="18" height="18" />}
                                    />
                                </div>
                            </nav>
                        </aside>

                        {/* content pane */}
                        <main className="w-full flex-1">{pane}</main>
                    </div>
                </div>
            </div>

            {/* settings */}
            <div className="border-card-border bg-background/95 sticky bottom-0 mx-2 border-t backdrop-blur-sm">
                <div className="mx-auto w-full py-4 md:max-w-lg ">
                    <Card className="flex items-center justify-evenly gap-2">
                        <Button color="ERROR" onClick={() => {}}>
                            Cancel Changes
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
