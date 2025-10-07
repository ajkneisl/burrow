import { AnimatePresence, motion } from "framer-motion"
import SearchPreview from "@features/search/components/SearchPreview.tsx"
import { type FormEvent, useEffect, useRef, useState } from "react"
import type { GroupMeetingResponse } from "@features/groups/api/groups.types.ts"
import { searchMeetings } from "@features/groups/api/groups.api.ts"
import useToken from "@features/auth/api/hooks/useToken.ts"
import SearchInput from "@features/search/components/SearchInput.tsx"
import MobileSearch from "@features/search/components/MobileSearch.tsx"

export default function Search() {
    const auth = useToken()
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
    const [debounceKey, setDebounceKey] = useState(0)
    const searchRef = useRef<HTMLFormElement>(null)
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<GroupMeetingResponse[] | null>(null)
    const [loading, setLoading] = useState(false)
    const [err, setErr] = useState<string | null>(null)

    function handleSubmit(e?: FormEvent) {
        if (e) e.preventDefault()
        if (!query.trim()) return
        setMobileSearchOpen(false)
    }

    // debounce effect
    useEffect(() => {
        if (query.trim().length < 2 || auth === null) {
            setResults(null)
            setLoading(false)
            setErr(null)
            return
        }

        const current = debounceKey + 1

        setDebounceKey(current)
        setLoading(true)
        setErr(null)

        const ctrl = new AbortController()

        const searchTimeout = setTimeout(async () => {
            try {
                const data = await searchMeetings(auth, null, query)

                // only set if still current
                if (current === debounceKey + 1 || current === debounceKey) {
                    setResults(data)
                }
            } catch (e: any) {
                if (e?.name !== "AbortError")
                    setErr(e?.message || "Search error")
            } finally {
                setLoading(false)
            }
        }, 250)

        return () => {
            ctrl.abort()
            clearTimeout(searchTimeout)
        }
    }, [query])

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                searchRef.current &&
                !searchRef.current.contains(e.target as Node)
            ) {
                setResults(null)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () =>
            document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const searchResults = (
        <AnimatePresence>
            {Boolean(results || loading || err) && (
                <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.16 }}
                    className="absolute left-0 right-0 mt-2 rounded-lg bg-card border border-card/80 shadow-lg overflow-hidden"
                >
                    {loading && (
                        <div className="px-3 py-2 text-sm text-text/60">
                            Searching…
                        </div>
                    )}

                    {err && !loading && (
                        <div className="px-3 py-2 text-sm text-red-600">
                            {err}
                        </div>
                    )}

                    {!loading && !err && results?.length === 0 && (
                        <div className="px-3 py-2 text-sm text-text/60">
                            No results
                        </div>
                    )}

                    {!loading && !err && results && results.length > 0 && (
                        <ul className="max-h-72 divide-y-1 divide-background overflow-auto">
                            {results.map(({ meeting }) => (
                                <li key={meeting.id}>
                                    <SearchPreview
                                        meeting={meeting}
                                        onClick={() => {
                                            setResults(null)
                                            setQuery("")
                                        }}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    )

    const input = (
        <SearchInput
            searchRef={searchRef}
            query={query}
            setQuery={setQuery}
            handleSubmit={handleSubmit}
            results={searchResults}
        />
    )

    return (
        <div className="hidden lg:flex flex-1 justify-center">
            <MobileSearch input={input} mobileSearchOpen={mobileSearchOpen} />

            {input}

            <button
                type="button"
                onClick={() => setMobileSearchOpen((prev) => !prev)}
                className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                aria-label="Toggle search dropdown"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="h-5 w-5"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 5.64 5.64a7.5 7.5 0 0 0 11.01 11.01z"
                    />
                </svg>
            </button>
        </div>
    )
}
