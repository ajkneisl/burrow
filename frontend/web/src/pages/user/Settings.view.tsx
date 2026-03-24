import { Button } from "@umnburrow/core"
import { useAtom } from "jotai"
import {
    settingsChanged,
    settingsSaveLoading,
    settingsSection
} from "@features/settings/settings.atom.ts"
import AccountSection from "@features/settings/components/AccountSection.tsx"
import ThemeSection from "@features/settings/components/ThemeSection.tsx"
import NotificationsSection from "@features/settings/components/NotificationsSection.tsx"
import SettingsNavigationButton from "@features/settings/components/SettingsNavigationButton.tsx"
import { Bell, Palette, User, UserRoundX } from "lucide-react"
import { useMemo } from "react"
import { AnimatePresence, motion } from "framer-motion"
import BlockedAccountsSection from "@features/settings/components/BlockedAccountsSection.tsx"

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
    const [hasChanged, setHasChanged] = useAtom(settingsChanged)

    // which type of settings to see
    const pane = useMemo(() => {
        setHasChanged(false)

        switch (section) {
            case "Account":
                return <AccountSection />
            case "Notifications":
                return <NotificationsSection />
            case "Theme":
                return <ThemeSection />
            case "Blocked Users":
                return <BlockedAccountsSection />
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
        }

        if (formID) {
            const form = document.getElementById(formID) as HTMLFormElement

            if (form !== null) {
                form.requestSubmit()
            }
        }
    }

    return (
        <div className="flex flex-col">
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
                                        icon={
                                            <Palette width="18" height="18" />
                                        }
                                    />

                                    <SettingsNavigationButton
                                        name="Blocked Users"
                                        icon={
                                            <UserRoundX
                                                width="18"
                                                height="18"
                                            />
                                        }
                                    />
                                </div>
                            </nav>

                            {/* save button*/}
                            <AnimatePresence>
                                {hasChanged && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.4 }}
                                        className="mt-4 flex w-full items-center justify-evenly"
                                    >
                                        <Button
                                            onClick={submit}
                                            color="SUCCESS"
                                            loading={loading}
                                        >
                                            Save Changes
                                        </Button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </aside>

                        {/* content pane */}
                        <main className="w-full flex-1">{pane}</main>
                    </div>
                </div>
            </div>
        </div>
    )
}
