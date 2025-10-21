import clsx from "clsx"
import type { FormEvent, ReactNode, RefObject } from "react"

type SearchInputProps = {
    query: string
    searchRef: RefObject<HTMLFormElement | null>
    setQuery: (query: string) => void
    handleSubmit: (e: FormEvent) => void
    results: ReactNode
}

export default function SearchInput({
    query,
    searchRef,
    setQuery,
    handleSubmit,
    results
}: SearchInputProps) {
    return (
        <form
            onSubmit={handleSubmit}
            role="search"
            className="relative w-full lg:min-w-md"
            ref={searchRef}
        >
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search groups, clubs, or tags..."
                className={clsx(
                    "text-white w-full rounded-lg px-3 py-2 text-sm shadow-sm ring-1 focus:outline-none focus:ring-2"
                )}
            />

            {/* search button*/}
            <button
                type="submit"
                className={clsx(
                    "absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1.5",
                    "bg-secondary hover:bg-secondary-hover transition-all text-gray-900",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ffcc33]",
                    "inline-flex items-center gap-1 rounded-md text-xs font-medium cursor-pointer"
                )}
                aria-label="Search"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="h-4 w-4"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 5.64 5.64a7.5 7.5 0 0 0 11.01 11.01z"
                    />
                </svg>
            </button>

            {results}
        </form>
    )
}
