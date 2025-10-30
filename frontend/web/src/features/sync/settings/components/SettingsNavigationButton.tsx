import { useAtom } from "jotai"
import clsx from "clsx"
import { settingsSection } from "@features/settings/api/settings.atom.ts"
import type { ReactNode } from "react"

/**
 * @see SettingsNavigationButton
 */
type SettingsNavigationButtonProps = {
    name: string
    icon?: ReactNode

}

/**
 * A button to navigate on the settings page.
 *
 * @param name The name of the section.
 * @param icon An optional icon for the button.
 */
export default function SettingsNavigationButton({
    name, icon
}: SettingsNavigationButtonProps) {
    const [section, setSection] = useAtom(settingsSection)

    return (
        <button
            type="button"
            onClick={() => setSection(name)}
            className={clsx(
                `inline-flex flex-row gap-2 cursor-pointer flex-1 rounded-lg px-3 py-3 text-sm`,
                section === name ? "bg-hero" : "hover:bg-hero/60"
            )}
        >
            {icon ? icon : <></>}
            {name}
        </button>
    )
}
