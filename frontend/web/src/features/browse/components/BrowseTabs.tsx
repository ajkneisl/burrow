import { NavLink } from "react-router"
import clsx from "clsx"

/**
 * The browsable sections, in the order they appear.
 */
const TABS: { label: string; to: string }[] = [
    { label: "Burrows", to: "/browse" },
    { label: "Clubs", to: "/clubs/browse" }
]

/**
 * Switches between the Burrow and Club browse pages.
 *
 * @author AJ Kneisl
 */
export default function BrowseTabs() {
    return (
        <nav className="mb-6 flex flex-wrap gap-2">
            {TABS.map((tab) => (
                <NavLink
                    key={tab.to}
                    to={tab.to}
                    end
                    className={({ isActive }) =>
                        clsx(
                            "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                            isActive
                                ? "border-primary bg-primary text-white"
                                : "border-border text-text/60 hover:border-primary hover:text-text"
                        )
                    }
                >
                    {tab.label}
                </NavLink>
            ))}
        </nav>
    )
}
