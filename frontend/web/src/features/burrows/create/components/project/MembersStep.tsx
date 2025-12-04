import { useState, useRef, useEffect, useMemo } from "react"
import { Input } from "@umnburrow/core"
import Field from "@features/burrows/create/components/Field.tsx"
import type { CreateStepProps } from "@features/burrows/create/create.types.ts"
import { get } from "@api/api.ts"
import { X } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import ProfilePicture from "@features/profile/components/ProfilePicture.tsx"
import {useAtom} from "jotai";
import {authToken} from "@features/auth/auth.atom.ts";

/**
 * {@see MembersStep}
 */
export type UserSearchResult = {
    id: string
    username: string
    name?: string
}

/**
 * A selected team member with display information
 */
export type SelectedMember = {
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
 *
 * @author AJ Kneisl
 */
export default function MembersStep({
    formState,
    updateField,
    mode = "create"
}: CreateStepProps & { mode?: "create" | "update" }) {
    const [auth] = useAtom(authToken)

    const [searchQuery, setSearchQuery] = useState("")
    const [debouncedQuery, setDebouncedQuery] = useState("")
    const [showDropdown, setShowDropdown] = useState(false)
    const searchTimeoutRef = useRef<number | null>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const selectedMembers: SelectedMember[] = useMemo(() => {
        if (!formState.tags.trim()) return []

        try {
            return JSON.parse(formState.tags)
        } catch {
            return formState.tags
                .split(",")
                .map((id) => id.trim())
                .filter(Boolean)
                .map((id) => ({ id, username: "", name: "" }))
        }
    }, [formState.tags])

    const selectedMemberIDs = selectedMembers.map((m) => m.id)

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

    const { data: searchResults = [], isLoading: isSearching } = useQuery({
        queryKey: ["userSearch", debouncedQuery],
        queryFn: () => searchUsersAPI(debouncedQuery),
        enabled: auth !== "" && debouncedQuery.trim().length >= 2,
        staleTime: 1000 * 60 * 5
    })

    const filteredResults = useMemo(() => {
        return searchResults.filter(
            (user) =>
                !selectedMemberIDs.includes(user.id) &&
                selectedMemberIDs.length < MAX_MEMBERS
        )
    }, [searchResults, selectedMemberIDs])

    useEffect(() => {
        setShowDropdown(
            filteredResults.length > 0 && debouncedQuery.trim().length >= 2
        )
    }, [filteredResults, debouncedQuery])

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

    function addMember(user: UserSearchResult) {
        if (selectedMemberIDs.length >= MAX_MEMBERS) return
        if (selectedMemberIDs.includes(user.id)) return

        const newMembers: SelectedMember[] = [
            ...selectedMembers,
            {
                id: user.id,
                username: user.username,
                name: user.name
            }
        ]
        updateField("tags", JSON.stringify(newMembers))
        setSearchQuery("")
        setShowDropdown(false)
    }

    function removeMember(userID: string) {
        const newMembers = selectedMembers.filter((m) => m.id !== userID)
        updateField("tags", JSON.stringify(newMembers))
    }

    return (
        <div className="space-y-6">
            {/* Update mode message */}
            {mode === "update" ? (
                <div className="border-info/30 bg-info/10 text-info rounded-lg border p-4">
                    <p className="text-sm font-medium">
                        To add or remove team members, please visit the project
                        page after saving your changes.
                    </p>
                </div>
            ) : (
                <div className="border-border bg-hero/50 rounded-lg border p-4">
                    <p className="text-text mb-2 text-sm font-medium">
                        Add Team Members
                    </p>
                    <p className="text-text/60 text-xs">
                        Add up to {MAX_MEMBERS} team members for this project. Start
                        typing a username to search.
                    </p>
                </div>
            )}

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
                        disabled={
                            mode === "update" ||
                            selectedMemberIDs.length >= MAX_MEMBERS
                        }
                        onFocus={() => {
                            if (searchResults.length > 0 && mode !== "update") {
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
                                        onClick={() => addMember(user)}
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
            {selectedMembers.length > 0 && (
                <div className="space-y-3">
                    <p className="text-text text-sm font-semibold">
                        Team Members ({selectedMembers.length}/{MAX_MEMBERS})
                    </p>
                    <div className="space-y-2">
                        {selectedMembers.map((member, index) => (
                            <div
                                key={member.id}
                                className="border-border bg-hero/30 hover:bg-hero/50 animate-in fade-in slide-in-from-left-2 group flex items-center justify-between rounded-lg border px-4 py-3 transition-all duration-200"
                                style={{
                                    animationDelay: `${index * 75}ms`,
                                    animationFillMode: "backwards"
                                }}
                            >
                                <div className="flex min-w-0 flex-1 items-center gap-3">
                                    <ProfilePicture
                                        name={member.name || member.username}
                                        userID={member.id}
                                        size="sm"
                                    />

                                    <div className="min-w-0 flex-1">
                                        <div className="text-text truncate text-sm font-medium">
                                            {member.name || member.username}
                                        </div>
                                        {member.name && member.username && (
                                            <div className="text-text/50 truncate text-xs">
                                                @{member.username}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {mode !== "update" && (
                                    <button
                                        type="button"
                                        onClick={() => removeMember(member.id)}
                                        className="text-text/40 hover:bg-error/20 hover:text-error ml-2 rounded-md p-1.5 transition-all duration-150"
                                        aria-label={`Remove ${member.name || member.username}`}
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
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
