import clsx from "clsx"
import type { FormEvent, ReactNode, RefObject } from "react"
import useToken from "@features/auth/api/hooks/useToken.ts"

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
    const auth = useToken()
    return (
        <form
            onSubmit={handleSubmit}
            role="search"
            className="relative w-full lg:min-w-md"
            ref={searchRef}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-text/70 pointer-events-none"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 5.64 5.64a7.5 7.5 0 0 0 11.01 11.01z"
                />
            </svg>
            <input
                disabled={auth === null}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search groups, clubs, or tags..."
                className={clsx(
                    "text-white w-full rounded-lg pl-8 pr-3 py-2 text-sm shadow-sm ring-1 focus:outline-none focus:ring-2",
                    auth === null && "cursor-not-allowed"
                )}
            />

            {results}
        </form>
    )
}
