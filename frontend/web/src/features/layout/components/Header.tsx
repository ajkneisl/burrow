import HeaderDropdown from "./HeaderDropdown.tsx"
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
import useToken from "@features/auth/hooks/useToken.ts"
import { CompassIcon, SearchIcon } from "lucide-react"

/**
 * The main header :)
 *
 * contains the search and dropdown navigation.
 *
 * @author AJ Kneisl
 */
export default function Header() {
    const nav = useNavigate()
    const auth = useToken()
    const location = useLocation()

    const [open, setMobileSearchOpen] = useAtom(mobileSearchOpen)
    const input = <Search />

    return (
        <div className="relative">
            <header
                className={clsx(
                    "bg-primary text-text sticky top-0 z-50 w-full flex-col",
                    !open && "shadow-md"
                )}
            >
                <div className="flex w-full flex-row items-center justify-between gap-4 px-4 py-3 md:px-6 md:py-4">
                    {/* logo */}
                    <div
                        className="flex cursor-pointer flex-row items-center justify-center gap-3"
                        onClick={() => nav("/")}
                    >
                        <div className="relative -top-3 h-8 w-8">
                            <div className="absolute inset-0 h-16 w-16 bg-[url('/image/burrow.png')] bg-contain bg-center bg-no-repeat" />
                        </div>

                        <h1 className="text-secondary hover:text-secondary-hover figtree ml-6 hidden text-3xl font-extrabold tracking-tight underline-offset-4 drop-shadow-sm transition-colors hover:underline md:block md:text-4xl">
                            Burrow
                        </h1>
                    </div>

                    {/* Search Bar */}
                    <div className="hidden items-center justify-center lg:flex">
                        {input}
                    </div>

                    <div className="flex items-center gap-2 md:gap-3">
                        {/* Create Button */}
                        {auth !== null && <CreateButton />}

                        {/* back button ONLY when not home */}
                        {location.pathname !== "/" &&
                            location.pathname !== "/welcome" && <HomeButton />}

                        <HeaderButton
                            className="md:hidden"
                            onClick={() => setMobileSearchOpen((prev) => !prev)}
                            icon={<SearchIcon className="h-5 w-5" />}
                        />

                        <HeaderButton
                            icon={<CompassIcon className="h-5 w-5" />}
                            onClick={() => nav("/study")}
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
