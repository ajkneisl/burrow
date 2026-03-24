import { AnimatePresence, motion } from "framer-motion"
import SearchPreview from "@features/layout/search/components/SearchPreview.tsx"
import UserSearchPreview from "@features/layout/search/components/UserSearchPreview.tsx"
import ClubSearchPreview from "@features/layout/search/components/ClubSearchPreview.tsx"
import { type FormEvent, useEffect, useRef, useState } from "react"
import {
    search,
    isUserResult,
    isBurrowResult,
    isClubResult,
    type SearchResult
} from "@features/layout/search/search.api.ts"
import { SearchInput } from "@features/layout/search/components/SearchInput.tsx"
import { useAtom, useSetAtom } from "jotai"
import {
    mobileSearchOpenAtom,
    searchQueryAtom
} from "@features/layout/search/search.atom.ts"
import type { PaginatedResponse } from "@api/api.types.ts"

/**
 * Search component for finding users and burrows.
 *
 * @author AJ Kneisl
 */
export default function Search() {
    const setMobileOpen = useSetAtom(mobileSearchOpenAtom)
    const [query, setQuery] = useAtom(searchQueryAtom)

    const [debounceKey, setDebounceKey] = useState(0)
    const searchRef = useRef<HTMLFormElement>(null)
    const [paginatedResults, setPaginatedResults] =
        useState<PaginatedResponse<SearchResult> | null>(null)
    const [loading, setLoading] = useState(false)
    const [err, setErr] = useState<string | null>(null)
    const [currentPage, setCurrentPage] = useState(1)

    function handleSubmit(e?: FormEvent) {
        if (e) e.preventDefault()
        if (!query.trim()) return
        setMobileOpen(false)
    }

    /**
     * Load a specific page of results
     */
    async function loadPage(page: number) {
        if (!query.trim() || query.trim().length < 2) return

        setLoading(true)
        setErr(null)

        try {
            const data = await search(query, page)
            setPaginatedResults(data)
            setCurrentPage(page)
        } catch (e: unknown) {
            const error = e as Error
            setErr(error?.message || "Search error")
        } finally {
            setLoading(false)
        }
    }

    /**
     * Debounced search effect
     */
    useEffect(() => {
        if (query.trim().length < 2) {
            setPaginatedResults(null)
            setLoading(false)
            setErr(null)
            setCurrentPage(1)
            return
        }

        const current = debounceKey + 1

        setDebounceKey(current)
        setLoading(true)
        setErr(null)

        const searchTimeout = setTimeout(async () => {
            try {
                const data = await search(query, 1)

                // Only set if still current search
                if (current === debounceKey + 1 || current === debounceKey) {
                    setPaginatedResults(data)
                    setCurrentPage(1)
                }
            } catch (e: unknown) {
                const error = e as Error
                if (error?.name !== "AbortError") {
                    setErr(error?.message || "Search error")
                }
            } finally {
                setLoading(false)
            }
        }, 250)

        return () => {
            clearTimeout(searchTimeout)
        }
    }, [query])

    /**
     * Close search results when clicking outside
     */
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                searchRef.current &&
                !searchRef.current.contains(e.target as Node)
            ) {
                setPaginatedResults(null)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () =>
            document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const results = paginatedResults?.contents ?? null
    const hasResults = results && results.length > 0
    const showPagination =
        hasResults && paginatedResults && paginatedResults.totalPages > 1

    const searchResults = (
        <AnimatePresence>
            {Boolean(paginatedResults || loading || err) && (
                <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.16 }}
                    className="border-card-border bg-card absolute top-full right-0 left-0 z-50 mt-2 overflow-hidden rounded-lg border shadow-lg"
                >
                    {loading && (
                        <div className="text-text/60 px-3 py-2 text-sm">
                            Searching…
                        </div>
                    )}

                    {err && !loading && (
                        <div className="text-error px-3 py-2 text-sm">
                            {err}
                        </div>
                    )}

                    {!loading && !err && results?.length === 0 && (
                        <div className="text-text/60 px-3 py-2 text-sm">
                            No results found for "{query}"
                        </div>
                    )}

                    {!loading && !err && hasResults && (
                        <>
                            <div className="divide-background max-h-72 divide-y overflow-auto">
                                <ul>
                                    {results.map((result) => {
                                        if (isUserResult(result)) {
                                            return (
                                                <li
                                                    key={`user-${result.userID}`}
                                                >
                                                    <UserSearchPreview
                                                        userID={result.userID}
                                                        username={
                                                            result.username
                                                        }
                                                        profile={result.profile}
                                                        onClick={() => {
                                                            setPaginatedResults(
                                                                null
                                                            )
                                                            setQuery("")
                                                        }}
                                                    />
                                                </li>
                                            )
                                        }

                                        if (isBurrowResult(result)) {
                                            return (
                                                <li
                                                    key={`burrow-${result.burrow.id}`}
                                                >
                                                    <SearchPreview
                                                        burrow={result.burrow}
                                                        onClick={() => {
                                                            setPaginatedResults(
                                                                null
                                                            )
                                                            setQuery("")
                                                        }}
                                                    />
                                                </li>
                                            )
                                        }

                                        if (isClubResult(result)) {
                                            return (
                                                <li
                                                    key={`club-${result.clubID}`}
                                                >
                                                    <ClubSearchPreview
                                                        clubID={result.clubID}
                                                        displayName={
                                                            result.displayName
                                                        }
                                                        name={result.name}
                                                        onClick={() => {
                                                            setPaginatedResults(
                                                                null
                                                            )
                                                            setQuery("")
                                                        }}
                                                    />
                                                </li>
                                            )
                                        }

                                        return null
                                    })}
                                </ul>
                            </div>

                            {showPagination && (
                                <div className="border-card-border bg-card border-t px-3 py-2">
                                    <div className="flex items-center justify-between gap-2">
                                        {/* Results info */}
                                        <span className="text-text/60 text-xs">
                                            Page {currentPage} of{" "}
                                            {paginatedResults.totalPages} (
                                            {paginatedResults.totalResults}{" "}
                                            results)
                                        </span>

                                        {/* Pagination controls */}
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() =>
                                                    loadPage(currentPage - 1)
                                                }
                                                disabled={
                                                    currentPage === 1 || loading
                                                }
                                                className="text-text hover:bg-background rounded px-2 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                                                aria-label="Previous page"
                                            >
                                                ← Prev
                                            </button>
                                            <button
                                                onClick={() =>
                                                    loadPage(currentPage + 1)
                                                }
                                                disabled={
                                                    currentPage ===
                                                        paginatedResults.totalPages ||
                                                    loading
                                                }
                                                className="text-text hover:bg-background rounded px-2 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                                                aria-label="Next page"
                                            >
                                                Next →
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    )

    return (
        <SearchInput
            searchRef={searchRef}
            query={query}
            setQuery={setQuery}
            handleSubmit={handleSubmit}
            results={searchResults}
        />
    )
}
