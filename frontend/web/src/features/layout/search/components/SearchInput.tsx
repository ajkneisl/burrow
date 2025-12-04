import clsx from "clsx"
import type { FormEvent, ReactNode, RefObject } from "react"
import useToken from "@features/auth/hooks/useToken.ts"
import { Search } from "lucide-react"

/**
 * {@see SearchInput}
 */
type SearchInputProps = {
    query: string
    searchRef: RefObject<HTMLFormElement | null>
    setQuery: (query: string) => void
    handleSubmit: (e: FormEvent) => void
    results: ReactNode
}

export function SearchInput({
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
            <div
                className={clsx(
                    "relative flex h-9 items-center rounded-lg border bg-white/5 px-3 shadow-sm backdrop-blur-sm transition-all duration-200",
                    "border-primary hover:border-secondary/30",
                    "focus-within:bg-white/5 focus-within:ring-primary/20 focus-within:shadow-md focus-within:ring-2",
                    auth === "" && "cursor-not-allowed opacity-50"
                )}
            >
                <Search className="text-text/50 group-focus-within:text-primary mr-2.5 h-4 w-4 flex-shrink-0 transition-colors duration-200" />

                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search Burrows, clubs, or tags..."
                    disabled={auth === ""}
                    className={clsx(
                        "text-text placeholder:text-text/40 h-full w-full flex-1 bg-transparent text-sm leading-none outline-none transition-colors",
                        "disabled:text-text/50 disabled:cursor-not-allowed"
                    )}
                />

                {query && (
                    <button
                        type="button"
                        onClick={() => setQuery("")}
                        className="text-text/40 hover:text-text hover:bg-background/60 ml-2 rounded-md p-1 transition-colors"
                        aria-label="Clear search"
                    >
                        <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                )}
            </div>

            {results}
        </form>
    )
}
