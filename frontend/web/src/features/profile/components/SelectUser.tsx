import { get } from "@umnburrow/core/api"
import { useEffect, useMemo, useRef, useState } from "react"
import { Input } from "@umnburrow/core"
import { useQuery } from "@tanstack/react-query"
import { useAtom } from "jotai"
import { authToken } from "@features/auth/auth.atom.ts"
import ProfilePicture from "@features/profile/components/ProfilePicture.tsx"
import { X } from "lucide-react"

export type UserSearchResult = {
    id: string
    username: string
    name?: string
}

async function searchUsersAPI(query: string): Promise<UserSearchResult[]> {
    if (query.trim().length < 2) return []
    return await get<UserSearchResult[]>("/user/search", {
        query: { query, exclude_me: true }
    })
}

type SelectUserProps = {
    value: UserSearchResult | null
    onChange: (user: UserSearchResult | null) => void
    placeholder?: string
}

export default function SelectUser({ value, onChange, placeholder = "Search for a user..." }: SelectUserProps) {
    const [auth] = useAtom(authToken)
    const [searchQuery, setSearchQuery] = useState("")
    const [debouncedQuery, setDebouncedQuery] = useState("")
    const [showDropdown, setShowDropdown] = useState(false)
    const searchTimeoutRef = useRef<number | null>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
        searchTimeoutRef.current = window.setTimeout(() => {
            setDebouncedQuery(searchQuery)
        }, 300)
        return () => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
        }
    }, [searchQuery])

    const { data: searchResults = [], isLoading: isSearching } = useQuery({
        queryKey: ["userSearch", debouncedQuery],
        queryFn: () => searchUsersAPI(debouncedQuery),
        enabled: auth !== "" && debouncedQuery.trim().length >= 2,
        staleTime: 1000 * 60 * 5
    })

    const filteredResults = useMemo(() => {
        if (value) return searchResults.filter((u) => u.id !== value.id)
        return searchResults
    }, [searchResults, value])

    useEffect(() => {
        setShowDropdown(filteredResults.length > 0 && debouncedQuery.trim().length >= 2)
    }, [filteredResults, debouncedQuery])

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    function selectUser(user: UserSearchResult) {
        onChange(user)
        setSearchQuery("")
        setShowDropdown(false)
    }

    if (value) {
        return (
            <div className="border-border flex items-center justify-between rounded-lg border bg-hero/30 px-4 py-3">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    <ProfilePicture
                        name={value.name || value.username}
                        userID={value.id}
                        size="sm"
                    />
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-text">
                            {value.name || value.username}
                        </div>
                        <div className="truncate text-xs text-text/50">
                            @{value.username}
                        </div>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={() => onChange(null)}
                    className="ml-2 rounded-md p-1.5 text-text/40 transition-all duration-150 hover:bg-error/20 hover:text-error"
                    aria-label={`Remove ${value.name || value.username}`}
                >
                    <X className="size-4" />
                </button>
            </div>
        )
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={placeholder}
                onFocus={() => {
                    if (searchResults.length > 0) setShowDropdown(true)
                }}
            />

            {showDropdown && (
                <div className="border-border animate-in fade-in slide-in-from-top-2 absolute z-10 mt-1 w-full rounded-lg border bg-background shadow-lg duration-200">
                    {isSearching ? (
                        <div className="p-3 text-center text-sm text-text/60">
                            Searching...
                        </div>
                    ) : filteredResults.length > 0 ? (
                        <div className="max-h-64 overflow-y-auto">
                            {filteredResults.map((user, index) => (
                                <button
                                    key={user.id}
                                    type="button"
                                    onClick={() => selectUser(user)}
                                    className="animate-in fade-in slide-in-from-top-1 flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-hero/60"
                                    style={{
                                        animationDelay: `${index * 50}ms`,
                                        animationFillMode: "backwards"
                                    }}
                                >
                                    <ProfilePicture
                                        name={user.name || user.username}
                                        userID={user.id}
                                        size="sm"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-medium text-text">
                                            {user.name || user.username}
                                        </div>
                                        <div className="truncate text-xs text-text/50">
                                            @{user.username}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-3 text-center text-sm text-text/60">
                            No users found
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
