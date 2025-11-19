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

/**
 * The input for searching through Burrows.
 *
 * @param query The search query.
 * @param searchRef The ref of the form.
 * @param setQuery To update {@link query}.
 * @param handleSubmit When the input is submitted.
 * @param results The results of the search.
 */
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
            <Search className="text-text/70 pointer-events-none absolute top-1/2 left-2 h-4 w-4 -translate-y-1/2" />

            <input
                disabled={auth === null}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search burrows, clubs, or tags..."
                className={clsx(
                    "border-card-border bg-background text-text w-full rounded-lg py-2 pr-3 pl-8 text-sm shadow-sm ring-secondary focus:ring-1 focus:outline-none",
                    auth === null && "cursor-not-allowed"
                )}
            />

            {results}
        </form>
    )
}
