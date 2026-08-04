import { get } from "@umnburrow/core/api"
import { useState, useEffect } from "react"
import { View, TextInput, FlatList, Pressable, ActivityIndicator } from "react-native"
import { Text } from "@components/core"
import { Search, X, UserPlus } from "lucide-react-native"
import ThemedIcon from "@components/core/ThemedIcon"

import { useThemeColors } from "@api/theme/useThemeColors"
import { ProfilePicture } from "@features/profile/components/ProfilePicture"

type UserSearchResult = {
    id: string
    name: string
    username: string
}

/**
 * {@link UserPicker}
 */
type UserPickerProps = {
    selectedUserIds: string[]
    onUserToggle: (userId: string) => void
    maxSelection?: number
    label?: string
    error?: string
    mode?: "single" | "multiple"
    disabled?: boolean
}

/**
 * A searchable user picker with single or multiple selection.
 *
 * @param selectedUserIds The currently selected user IDs.
 * @param onUserToggle Called when a user is selected or deselected.
 * @param maxSelection Maximum number of users that can be selected.
 * @param label Optional label displayed above the picker.
 * @param error Optional error message displayed below the input.
 * @param mode Whether to allow single or multiple selection.
 * @param disabled Whether the picker is disabled.
 *
 * @author AJ Kneisl
 */
export function UserPicker({
    selectedUserIds,
    onUserToggle,
    maxSelection,
    label,
    error,
    mode = "multiple",
    disabled = false
}: UserPickerProps) {
    const colors = useThemeColors()
    const [searchQuery, setSearchQuery] = useState("")
    const [results, setResults] = useState<UserSearchResult[]>([])
    const [loading, setLoading] = useState(false)
    const [debouncedQuery, setDebouncedQuery] = useState("")
    const [selectedUsers, setSelectedUsers] = useState<
        Map<string, UserSearchResult>
    >(new Map())

    // Set default maxSelection based on mode
    const effectiveMaxSelection = maxSelection ?? (mode === "single" ? 1 : 10)

    // Debounce search query
    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedQuery(searchQuery)
        }, 300)

        return () => clearTimeout(timeout)
    }, [searchQuery])

    // Fetch search results
    useEffect(() => {
        if (!debouncedQuery.trim()) {
            setResults([])
            return
        }

        const searchUsers = async () => {
            setLoading(true)
            try {
                const response = await get<UserSearchResult[]>("/user/search", {
                    query: { query: debouncedQuery, exclude_me: true }
                })

                setResults(response)
            } catch (error) {
                console.error("Error searching users:", error)
                setResults([])
            } finally {
                setLoading(false)
            }
        }

        searchUsers()
    }, [debouncedQuery])

    const isSelected = (userId: string) => selectedUserIds.includes(userId)
    const canSelect = selectedUserIds.length < effectiveMaxSelection

    // Keep selectedUsers in sync when IDs are removed externally
    useEffect(() => {
        setSelectedUsers((prev) => {
            const next = new Map(prev)
            for (const id of next.keys()) {
                if (!selectedUserIds.includes(id)) next.delete(id)
            }
            return next
        })
    }, [selectedUserIds])

    const handleUserSelect = (userId: string) => {
        // Cache user data when selecting
        const user = results.find((r) => r.id === userId)
        if (user && !selectedUsers.has(userId)) {
            setSelectedUsers((prev) => new Map(prev).set(userId, user))
        }

        if (mode === "single") {
            onUserToggle(userId)
            setSearchQuery("")
            setResults([])
        } else {
            onUserToggle(userId)
        }
    }

    const handleRemoveUser = (userId: string) => {
        setSelectedUsers((prev) => {
            const next = new Map(prev)
            next.delete(userId)
            return next
        })
        onUserToggle(userId)
    }

    const renderUserItem = ({ item }: { item: UserSearchResult }) => {
        const selected = isSelected(item.id)
        const disabled = !selected && !canSelect

        return (
            <Pressable
                onPress={() => !disabled && handleUserSelect(item.id)}
                disabled={disabled}
                className={`flex-row items-center p-3 border-b border-card-border ${
                    disabled ? "opacity-50" : ""
                }`}
            >
                {/* Avatar */}
                <View className="mr-3">
                    <ProfilePicture
                        name={item.name || item.username}
                        userID={item.id}
                        size="sm"
                    />
                </View>

                {/* User Info */}
                <View className="flex-1">
                    <Text className="text-text font-semibold">
                        {item.name || item.username}
                    </Text>
                    <Text className="text-text text-opacity-60 text-sm">
                        @{item.username}
                    </Text>
                </View>

                {/* Checkbox/Action */}
                {selected ? (
                    <Pressable
                        onPress={() => onUserToggle(item.id)}
                        className="bg-error rounded-full p-2"
                    >
                        <X size={16} color="#FFFFFF" />
                    </Pressable>
                ) : (
                    <View
                        className={`rounded-full p-2 ${
                            disabled ? "bg-card" : "bg-primary"
                        }`}
                    >
                        <UserPlus size={16} color="#FFFFFF" />
                    </View>
                )}
            </Pressable>
        )
    }

    return (
        <View className="mb-4">
            {label && (
                <Text className="text-sm font-semibold text-text mb-2">
                    {label}
                </Text>
            )}

            {!disabled && (
                <>
                    <View
                        className={`flex-row items-center px-4 py-3 rounded-lg border ${
                            error
                                ? "border-error"
                                : "border-card-border"
                        } bg-background mb-2`}
                    >
                        <ThemedIcon icon={Search} size={20} opacity={0.6} />
                        <TextInput
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder={
                                mode === "single"
                                    ? "Search for a user..."
                                    : "Search by username or name..."
                            }
                            className="flex-1 ml-2 text-base text-text"
                            placeholderTextColor="#9CA3AF"
                        />
                        {loading && (
                            <ActivityIndicator
                                size="small"
                                color={colors.primary}
                            />
                        )}
                    </View>

                    {error && (
                        <Text className="text-sm text-error mb-2">{error}</Text>
                    )}
                </>
            )}

            {mode === "multiple" && (
                <Text className="text-xs text-text opacity-60 mb-2">
                    {selectedUserIds.length} / {effectiveMaxSelection} members
                    {disabled ? "" : " selected"}
                </Text>
            )}

            {!disabled && results.length > 0 && (
                <View className="border border-card-border rounded-lg bg-background max-h-64">
                    <FlatList
                        data={results}
                        keyExtractor={(item) => item.id}
                        renderItem={renderUserItem}
                        nestedScrollEnabled
                    />
                </View>
            )}

            {!disabled && !loading && debouncedQuery && results.length === 0 && (
                <View className="p-4 border border-card-border rounded-lg bg-card">
                    <Text className="text-text opacity-70 text-center">
                        No users found for &quot;{debouncedQuery}&quot;
                    </Text>
                </View>
            )}

            {!disabled && !searchQuery && selectedUserIds.length === 0 && (
                <View className="p-4 border border-card-border rounded-lg bg-card">
                    <Text className="text-text opacity-70 text-center text-sm">
                        {mode === "single"
                            ? "Search for a user to select"
                            : "Search for users to add as team members"}
                    </Text>
                </View>
            )}

            {/* Selected users */}
            {selectedUsers.size > 0 && (
                <View className="flex-row flex-wrap gap-2 mt-2">
                    {Array.from(selectedUsers.values()).map((user) => (
                        <View
                            key={user.id}
                            className="flex-row items-center bg-card border border-card-border rounded-full px-2 py-1 gap-2"
                        >
                            <ProfilePicture
                                name={user.name || user.username}
                                userID={user.id}
                                size="sm"
                            />
                            <Text className="text-text text-sm">
                                {user.name || user.username}
                            </Text>
                            {!disabled && (
                                <Pressable onPress={() => handleRemoveUser(user.id)}>
                                    <X size={14} color={colors.error} />
                                </Pressable>
                            )}
                        </View>
                    ))}
                </View>
            )}
        </View>
    )
}
