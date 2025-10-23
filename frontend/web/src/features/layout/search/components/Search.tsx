import { AnimatePresence, motion } from "framer-motion"
import SearchPreview from "@features/layout/search/components/SearchPreview.tsx"
import { type FormEvent, useEffect, useRef, useState } from "react"
import type { GroupMeetingResponse } from "@features/groups/api/groups.types.ts"
import { searchMeetings } from "@features/groups/api/groups.api.ts"
import useToken from "@features/auth/api/hooks/useToken.ts"
import SearchInput from "@features/layout/search/components/SearchInput.tsx"
import { useAtom } from "jotai"
import { mobileSearchOpen } from "@features/layout/search/search.atom.ts"

export default function Search() {
    const auth = useToken()
    const [, setMobileOpen] = useAtom(mobileSearchOpen)
    const [debounceKey, setDebounceKey] = useState(0)
    const searchRef = useRef<HTMLFormElement>(null)
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<GroupMeetingResponse[] | null>(null)
    const [loading, setLoading] = useState(false)
    const [err, setErr] = useState<string | null>(null)

    function handleSubmit(e?: FormEvent) {
        if (e) e.preventDefault()
        if (!query.trim()) return
        setMobileOpen(false)
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
                    className="absolute left-0 right-0 top-full mt-2 z-[1000] rounded-lg bg-card border border-card-border shadow-lg overflow-hidden"
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
