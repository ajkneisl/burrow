import { useAtom } from "jotai"
import clsx from "clsx"
import { settingsSection } from "@features/settings/api/settings.atom.ts"

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
                `cursor-pointer flex-1 rounded-md px-3 py-2 text-sm`,
                section === name ? "bg-card" : "hover:bg-card/60"
            )}
        >
            {name}
        </button>
    )
}
