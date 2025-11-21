import { useState, useRef, useEffect, useMemo } from "react"
import { Input } from "@umnburrow/core"
import Field from "@features/burrows/create/components/Field.tsx"
import type { CreateStepProps } from "@features/burrows/create/create.types.ts"
import { get } from "@api/api.ts"
import { X } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import ProfilePicture from "@features/profile/components/ProfilePicture.tsx"

/**
 * {@see MembersStep}
 */
export type UserSearchResult = {
    id: string
    username: string
    name?: string
}

/**
 * Search for users by username or profile name.
 *
 * @param query The search query.
 * @returns A list of matching users (up to 10).
 */
async function searchUsersAPI(query: string): Promise<UserSearchResult[]> {
    if (query.trim().length < 2) {
        return []
    }

    return await get<UserSearchResult[]>("/user/search", {
        query: { query, exclude_me: true }
    })
}

const MAX_MEMBERS = 10

/**
 * Members step for creating a project - allows adding up to 10 team members.
 *
 * @see CreateProjectBurrowModal
 */
export default function MembersStep({
    formState,
    updateField
}: CreateStepProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [debouncedQuery, setDebouncedQuery] = useState("")
    const [showDropdown, setShowDropdown] = useState(false)
    const searchTimeoutRef = useRef<number | null>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Parse member IDs from formState (stored as comma-separated in tags field)
    // Note: tags field is repurposed for project member IDs since projects don't use tags
    const selectedMemberIDs = formState.tags
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean)

    // Debounce search query
    useEffect(() => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current)
        }

        searchTimeoutRef.current = window.setTimeout(() => {
            setDebouncedQuery(searchQuery)
        }, 300)

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current)
            }
        }
    }, [searchQuery])

    // Use TanStack Query for user search
    const { data: searchResults = [], isLoading: isSearching } = useQuery({
        queryKey: ["userSearch", debouncedQuery],
        queryFn: () => searchUsersAPI(debouncedQuery),
        enabled: debouncedQuery.trim().length >= 2,
        staleTime: 1000 * 60 * 5 // Cache for 5 minutes
    })

    // Filter out already selected members
    const filteredResults = useMemo(() => {
        return searchResults.filter(
            (user) =>
                !selectedMemberIDs.includes(user.id) &&
                selectedMemberIDs.length < MAX_MEMBERS
        )
    }, [searchResults, selectedMemberIDs])

    // Show dropdown when there are results
    useEffect(() => {
        setShowDropdown(
            filteredResults.length > 0 && debouncedQuery.trim().length >= 2
        )
    }, [filteredResults, debouncedQuery])

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setShowDropdown(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () =>
            document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    function addMember(userID: string) {
        if (selectedMemberIDs.length >= MAX_MEMBERS) return
        if (selectedMemberIDs.includes(userID)) return

        const newMemberIDs = [...selectedMemberIDs, userID]
        updateField("tags", newMemberIDs.join(", "))
        setSearchQuery("")
        setShowDropdown(false)
    }

    function removeMember(userID: string) {
        const newMemberIDs = selectedMemberIDs.filter((id) => id !== userID)
        updateField("tags", newMemberIDs.join(", "))
    }

    return (
        <div className="space-y-6">
            <div className="border-border bg-hero/50 rounded-lg border p-4">
                <p className="text-text mb-2 text-sm font-medium">
                    Add Team Members
                </p>
                <p className="text-text/60 text-xs">
                    Add up to {MAX_MEMBERS} team members for this project. Start
                    typing a username to search.
                </p>
            </div>

            {/* Search input */}
            <div className="relative" ref={dropdownRef}>
                <Field
                    label={`Add Members (${selectedMemberIDs.length}/${MAX_MEMBERS})`}
                    className="min-w-0"
                >
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search for teammates..."
                        disabled={selectedMemberIDs.length >= MAX_MEMBERS}
                        onFocus={() => {
                            if (searchResults.length > 0) {
                                setShowDropdown(true)
                            }
                        }}
                    />
                </Field>

                {/* Dropdown results */}
                {showDropdown && (
                    <div className="border-border bg-background animate-in fade-in slide-in-from-top-2 absolute z-10 mt-1 w-full rounded-lg border shadow-lg duration-200">
                        {isSearching ? (
                            <div className="text-text/60 p-3 text-center text-sm">
                                Searching...
                            </div>
                        ) : filteredResults.length > 0 ? (
                            <div className="max-h-64 overflow-y-auto">
                                {filteredResults.map((user, index) => (
                                    <button
                                        key={user.id}
                                        type="button"
                                        onClick={() => addMember(user.id)}
                                        className="hover:bg-hero/60 animate-in fade-in slide-in-from-top-1 flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors duration-150"
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
                                            <div className="text-text truncate text-sm font-medium">
                                                {user.name || user.username}
                                            </div>

                                            <div className="text-text/50 truncate text-xs">
                                                @{user.username}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-text/60 p-3 text-center text-sm">
                                No users found
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Selected members */}
            {selectedMemberIDs.length > 0 && (
                <div className="space-y-3">
                    <p className="text-text text-sm font-semibold">
                        Team Members ({selectedMemberIDs.length}/{MAX_MEMBERS})
                    </p>
                    <div className="space-y-2">
                        {selectedMemberIDs.map((userID, index) => (
                            <div
                                key={userID}
                                className="border-border bg-hero/30 hover:bg-hero/50 animate-in fade-in slide-in-from-left-2 group flex items-center justify-between rounded-lg border px-4 py-3 transition-all duration-200"
                                style={{
                                    animationDelay: `${index * 75}ms`,
                                    animationFillMode: "backwards"
                                }}
                            >
                                <div className="flex min-w-0 flex-1 items-center gap-3">
                                    <ProfilePicture
                                        name={userID}
                                        userID={userID}
                                        size="sm"
                                    />
                                    <span className="text-text truncate text-sm font-medium">
                                        Member {index + 1}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeMember(userID)}
                                    className="text-text/40 hover:bg-error/20 hover:text-error ml-2 rounded-md p-1.5 transition-all duration-150"
                                    aria-label={`Remove member`}
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {selectedMemberIDs.length === 0 && (
                <div className="border-border bg-hero/20 rounded-lg border border-dashed p-8 text-center">
                    <p className="text-text/50 text-sm">
                        No members added yet. Search and add teammates above.
                    </p>
                </div>
            )}
        </div>
    )
}
