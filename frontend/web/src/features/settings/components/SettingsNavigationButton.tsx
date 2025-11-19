import { useAtom } from "jotai"
import clsx from "clsx"
import { settingsSection } from "@features/settings/settings.atom.ts"
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
 *
 * @author AJ Kneisl
 */
export default function SettingsNavigationButton({
    name,
    icon
}: SettingsNavigationButtonProps) {
    const [section, setSection] = useAtom(settingsSection)

    return (
        <button
            type="button"
            onClick={() => setSection(name)}
            className={clsx(
                `inline-flex flex-1 cursor-pointer flex-row items-center justify-between gap-2 rounded-lg px-3 py-3 text-xs md:text-sm`,
                section === name ? "bg-hero" : "hover:bg-hero/60"
            )}
        >
            {name}

            {icon ? icon : <></>}
        </button>
    )
}
