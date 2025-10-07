import HeaderDropdown from "./components/HeaderDropdown.tsx"
import { useLocation, useNavigate } from "react-router"
import ViewNotifications from "@features/notifications/components/ViewNotifications.tsx"
import CreateButton from "@features/layout/components/CreateButton.tsx"
import Search from "@features/search/components/Search.tsx"
import BackButton from "@features/layout/components/BackButton.tsx"

/**
 * The main header :)
 *
 * contains the search and dropdown navigation.
 */
export default function Header() {
    const nav = useNavigate()
    const location = useLocation()

    return (
        <header className="sticky top-0 z-50 w-full bg-primary/90 text-white backdrop-blur supports-[backdrop-filter]:backdrop-blur-md shadow-md after:block after:h-px after:bg-primary/20">
            <div className="w-full px-4 md:px-6 py-3 md:py-4 flex flex-row items-center justify-between gap-4">
                {/* logo */}
                <div className="flex flex-row items-center gap-3">
                    <h1
                        onClick={() => nav("/")}
                        className="transition-colors text-3xl md:text-4xl text-secondary hover:text-secondary-hover cursor-pointer font-extrabold figtree tracking-tight drop-shadow-sm underline-offset-4 hover:underline"
                    >
                        Burrow
                    </h1>
                </div>

                {/* Search Bar */}
                <Search />

                <div className="flex items-center gap-2 md:gap-3">
                    {/* back button ONLY when not home */}
                    {location.pathname !== "/" &&
                        location.pathname !== "/welcome" && <BackButton />}

                    {/* Create Button */}
                    <CreateButton />

                    {/* Notifications Bell */}
                    <ViewNotifications />

                    {/* Header Dropdown */}
                    <HeaderDropdown />
                </div>
            </div>
        </header>
    )
}
