import { useState, useEffect } from "react"
import {
    View,
    Text,
    TextInput,
    FlatList,
    Pressable,
    ActivityIndicator
} from "react-native"
import { Search, X, UserPlus } from "lucide-react-native"
import { get } from "@api/api"
import { useThemeColors } from "@api/theme/useThemeColors"
import { ProfilePicture } from "@components/profile/ProfilePicture"

type UserSearchResult = {
    id: string
    name: string
    username: string
}

type UserPickerProps = {
    selectedUserIds: string[]
    onUserToggle: (userId: string) => void
    maxSelection?: number
    label?: string
    error?: string
    mode?: "single" | "multiple"
    disabled?: boolean
}

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

    const handleUserSelect = (userId: string) => {
        if (mode === "single") {
            // In single mode, clear search and close results after selection
            onUserToggle(userId)
            setSearchQuery("")
            setResults([])
        } else {
            // In multiple mode, keep search open
            onUserToggle(userId)
        }
    }

    const renderUserItem = ({ item }: { item: UserSearchResult }) => {
        const selected = isSelected(item.id)
        const disabled = !selected && !canSelect

        return (
            <Pressable
                onPress={() => !disabled && handleUserSelect(item.id)}
                disabled={disabled}
                className={`flex-row items-center p-3 border-b border-gray-200 ${
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
                            disabled
                                ? "bg-card dark:bg-card"
                                : "bg-primary dark:bg-primary"
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
                                : "border-card-border dark:border-card-border"
                        } bg-background dark:bg-background mb-2`}
                    >
                        <Search
                            size={20}
                            color={colors.text}
                            style={{ opacity: 0.6 }}
                        />
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
                <Text className="text-xs text-text dark:text-text opacity-60 mb-2">
                    {selectedUserIds.length} / {effectiveMaxSelection} members
                    {disabled ? "" : " selected"}
                </Text>
            )}

            {!disabled && results.length > 0 && (
                <View className="border border-card-border dark:border-card-border rounded-lg bg-background dark:bg-background max-h-64">
                    <FlatList
                        data={results}
                        keyExtractor={(item) => item.id}
                        renderItem={renderUserItem}
                        nestedScrollEnabled
                    />
                </View>
            )}

            {!disabled && !loading && debouncedQuery && results.length === 0 && (
                <View className="p-4 border border-card-border dark:border-card-border rounded-lg bg-card dark:bg-card">
                    <Text className="text-text dark:text-text opacity-70 text-center">
                        No users found for &quot;{debouncedQuery}&quot;
                    </Text>
                </View>
            )}

            {!disabled && !searchQuery && selectedUserIds.length === 0 && (
                <View className="p-4 border border-card-border dark:border-card-border rounded-lg bg-card dark:bg-card">
                    <Text className="text-text dark:text-text opacity-70 text-center text-sm">
                        {mode === "single"
                            ? "Search for a user to select"
                            : "Search for users to add as team members"}
                    </Text>
                </View>
            )}
        </View>
    )
}
