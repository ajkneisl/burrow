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
import clsx from "clsx"

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
    }, [section, setHasChanged])

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

                            {/* save button (desktop) — sticky so it stays in view
                                while scrolling a long pane like Notifications,
                                instead of scrolling out of reach above the fold */}
                            <AnimatePresence>
                                {hasChanged && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.4 }}
                                        className="mt-4 hidden w-full items-center justify-evenly lg:sticky lg:top-24 lg:flex"
                                    >
                                        <Button
                                            onClick={submit}
                                            color="SUCCESS"
                                            loading={loading}
                                            className="w-full"
                                        >
                                            Save Changes
                                        </Button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </aside>

                        {/* content pane */}
                        <main
                            className={clsx(
                                "w-full flex-1",
                                hasChanged && "pb-24 lg:pb-0"
                            )}
                        >
                            {pane}
                        </main>
                    </div>
                </div>
            </div>

            {/* save button (mobile/tablet) — the aside stacks above this pane on
                narrow viewports, so once the user scrolls into the content the
                button scrolls out of view; float it above the content instead
                of relying on them to notice and scroll back up */}
            <AnimatePresence>
                {hasChanged && (
                    <motion.div
                        initial={{ y: 96, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 96, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="border-card-border bg-background fixed inset-x-0 bottom-0 z-[900] border-t p-4 shadow-lg lg:hidden"
                    >
                        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3">
                            <p className="text-sm opacity-70">
                                You have unsaved changes
                            </p>

                            <Button
                                onClick={submit}
                                color="SUCCESS"
                                loading={loading}
                            >
                                Save Changes
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
