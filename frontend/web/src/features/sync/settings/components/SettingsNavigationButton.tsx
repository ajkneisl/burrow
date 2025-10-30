import { useAtom } from "jotai"
import clsx from "clsx"
import { settingsSection } from "@features/sync/settings/settings.atom.ts"

/**
 * @see SettingsNavigationButton
 */
type SettingsNavigationButtonProps = {
    name: string
}

/**
 * A button to navigate on the settings page.
 *
 * @param name The name of the section.
 */
export default function SettingsNavigationButton({
    name
}: SettingsNavigationButtonProps) {
    const [section, setSection] = useAtom(settingsSection)

    return (
        <button
            type="button"
            onClick={() => setSection(name)}
            className={clsx(
                `cursor-pointer flex-1 rounded-lg px-3 py-3 text-sm`,
                section === name ? "bg-hero" : "hover:bg-hero/60"
            )}
        >
            {name}
        </button>
    )
}
