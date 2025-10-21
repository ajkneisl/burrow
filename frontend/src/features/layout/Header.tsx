import HeaderDropdown from "./components/HeaderDropdown.tsx"
import { useLocation, useNavigate } from "react-router"
import ViewNotifications from "@features/notifications/components/ViewNotifications.tsx"
import CreateButton from "@features/layout/components/CreateButton.tsx"
import Search from "@features/layout/search/components/Search.tsx"
import HomeButton from "@features/layout/components/HomeButton.tsx"
import HeaderButton from "@features/layout/components/HeaderButton.tsx"
import { useAtom } from "jotai"
import { mobileSearchOpen } from "@features/layout/search/search.atom.ts"
import MobileSearch from "@features/layout/search/components/MobileSearch.tsx"
import clsx from "clsx"

/**
 * The main header :)
 *
 * contains the search and dropdown navigation.
 */
export default function Header() {
    const nav = useNavigate()
    const location = useLocation()

    const [open, setMobileSearchOpen] = useAtom(mobileSearchOpen)
    const input = <Search />

    return (
        <div className="relative">
            <header
                className={clsx(
                    "flex-col sticky top-0 z-50 w-full bg-primary text-text",
                    !open && "shadow-md"
                )}
            >
                <div className="w-full px-4 md:px-6 py-3 md:py-4 flex flex-row items-center justify-between gap-4">
                    {/* logo */}
                    <div
                        className="flex flex-row items-center gap-3 cursor-pointer"
                        onClick={() => nav("/")}
                    >
                        <img
                            src="/burrow.png"
                            alt="Burrow Logo"
                            className="bg-primary w-[48px] h-[48px] object-cover rounded-2xl"
                        />

                        <h1 className="md:block hidden transition-colors text-3xl md:text-4xl text-secondary hover:text-secondary-hover font-extrabold figtree tracking-tight drop-shadow-sm underline-offset-4 hover:underline">
                            Burrow
                        </h1>
                    </div>

                    {/* Search Bar */}
                    <div className="lg:flex hidden items-center justify-center">
                        {input}
                    </div>

                    <div className="flex items-center gap-2 md:gap-3">
                        {/* Create Button */}
                        <CreateButton />

                        {/* back button ONLY when not home */}
                        {location.pathname !== "/" &&
                            location.pathname !== "/welcome" && <HomeButton />}

                        <HeaderButton
                            className="md:hidden"
                            onClick={() => setMobileSearchOpen((prev) => !prev)}
                            icon={
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <circle cx="11" cy="11" r="7" strokeLinecap="round" strokeLinejoin="round" />
                                    <line x1="16.65" y1="16.65" x2="21" y2="21" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            }
                        />

                        {/* Notifications Bell */}
                        <ViewNotifications />

                        {/* Header Dropdown */}
                        <HeaderDropdown />
                    </div>
                </div>
            </header>

            <MobileSearch input={input} />
        </div>
    )
}
