import { AnimatePresence, motion } from "framer-motion"
import SearchPreview from "@features/layout/search/components/SearchPreview.tsx"
import { type FormEvent, useEffect, useRef, useState } from "react"
import type { BurrowResponse } from "@features/burrows/burrows.types.ts"
import { searchMeetings } from "@features/burrows/burrows.api.ts"
import SearchInput from "@features/layout/search/components/SearchInput.tsx"
import { useAtom } from "jotai"
import { mobileSearchOpen } from "@features/layout/search/search.atom.ts"
import type { PaginatedResponse } from "@api/api.types.ts"

/**
 * Search component for finding burrows/meetings.
 * Features debounced search and pagination support.
 */
export default function Search() {
    const [, setMobileOpen] = useAtom(mobileSearchOpen)
    const [debounceKey, setDebounceKey] = useState(0)
    const searchRef = useRef<HTMLFormElement>(null)
    const [query, setQuery] = useState("")
    const [paginatedResults, setPaginatedResults] =
        useState<PaginatedResponse<BurrowResponse> | null>(null)
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
            const data = await searchMeetings("STUDY", query, page)
            setPaginatedResults(data)
            setCurrentPage(page)
        } catch (e: any) {
            setErr(e?.message || "Search error")
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
                const data = await searchMeetings("STUDY", query, 1)

                // Only set if still current search
                if (current === debounceKey + 1 || current === debounceKey) {
                    setPaginatedResults(data)
                    setCurrentPage(1)
                }
            } catch (e: any) {
                if (e?.name !== "AbortError") {
                    setErr(e?.message || "Search error")
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
                    className="absolute left-0 right-0 top-full z-[1000] mt-2 overflow-hidden rounded-lg border border-card-border bg-card shadow-lg"
                >
                    {loading && (
                        <div className="px-3 py-2 text-sm text-text/60">
                            Searching…
                        </div>
                    )}

                    {err && !loading && (
                        <div className="px-3 py-2 text-sm text-error">
                            {err}
                        </div>
                    )}

                    {!loading && !err && results?.length === 0 && (
                        <div className="px-3 py-2 text-sm text-text/60">
                            No results found for "{query}"
                        </div>
                    )}

                    {!loading && !err && hasResults && (
                        <>
                            <div className="max-h-72 divide-y-1 divide-background overflow-auto">
                                <ul>
                                    {results.map(({ burrow }) => (
                                        <li key={burrow.id}>
                                            <SearchPreview
                                                meeting={burrow}
                                                onClick={() => {
                                                    setPaginatedResults(null)
                                                    setQuery("")
                                                }}
                                            />
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {showPagination && (
                                <div className="border-t border-card-border bg-card px-3 py-2">
                                    <div className="flex items-center justify-between gap-2">
                                        {/* Results info */}
                                        <span className="text-xs text-text/60">
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
                                                className="rounded px-2 py-1 text-xs font-medium text-text transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
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
                                                className="rounded px-2 py-1 text-xs font-medium text-text transition-colors hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
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
