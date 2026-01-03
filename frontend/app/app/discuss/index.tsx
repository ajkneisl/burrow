import { useState } from "react"
import { View, Text, FlatList, Pressable, ScrollView } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { MessageSquare, Pin, Plus } from "lucide-react-native"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createTopic, getTopics } from "@features/chat/chat.api"
import type { Topic } from "@features/chat/chat.types"
import { Card, Button, Input } from "@components/core"
import { Header } from "@features/layout/components"
import { ViewErrors } from "@components/core"
import Toast from "react-native-toast-message"
import { useThemeColors } from "@api/theme/useThemeColors"

export default function DiscussScreen() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const colors = useThemeColors()

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["topics"],
        queryFn: async () => await getTopics(1)
    })

    const mutation = useMutation({
        mutationFn: (data: { name: string; description?: string }) =>
            createTopic(data.name, data.description),

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["topics"] })
            Toast.show({
                type: "success",
                text1: "Topic created!"
            })
            setNewName("")
            setNewDescription("")
            setShowCreate(false)
        },
        onError: (error: any) => {
            Toast.show({
                type: "error",
                text1: "Failed to create topic",
                text2: error.message || "Please try again"
            })
        }
    })

    const [showCreate, setShowCreate] = useState(false)
    const [newName, setNewName] = useState("")
    const [newDescription, setNewDescription] = useState("")

    const handleCreateTopic = () => {
        if (newName.trim().length === 0) {
            Toast.show({
                type: "error",
                text1: "Topic name required"
            })
            return
        }

        mutation.mutate({
            name: newName.trim(),
            description: newDescription.trim() || undefined
        })
    }

    const handleTopicPress = (topic: Topic) => {
        router.push(`/discuss/${topic.id}`)
    }

    const renderTopic = ({ item }: { item: Topic }) => (
        <Pressable
            onPress={() => handleTopicPress(item)}
            className="active:opacity-70"
        >
            <Card
                variant={item.pinned ? "elevated" : "bordered"}
                className="mb-3"
            >
                <View className="flex-row items-start gap-4">
                    <View
                        className={`w-12 h-12 rounded-lg items-center justify-center ${
                            item.pinned ? "bg-primary" : "bg-secondary/10"
                        }`}
                    >
                        {item.pinned ? (
                            <Pin size={24} color="#FFFFFF" />
                        ) : (
                            <MessageSquare size={24} color={colors.secondary} />
                        )}
                    </View>

                    <View className="flex-1 min-w-0">
                        <Text className="text-lg font-semibold text-text">
                            {item.name}
                        </Text>

                        {item.description && (
                            <Text
                                className="text-sm text-text text-opacity-60 mt-1"
                                numberOfLines={2}
                            >
                                {item.description}
                            </Text>
                        )}

                        {item.createdAt !== -1 && (
                            <Text className="text-xs text-text text-opacity-40 mt-2">
                                Created{" "}
                                {new Date(item.createdAt).toLocaleDateString()}
                            </Text>
                        )}
                    </View>
                </View>
            </Card>
        </Pressable>
    )

    const renderEmpty = () => (
        <View className="items-center justify-center py-12">
            <MessageSquare size={48} color={colors.text} style={{ opacity: 0.2 }} />
            <Text className="text-text text-opacity-60 text-lg mt-4">No topics yet.</Text>
            <Text className="text-text text-opacity-40 text-sm mt-1">
                Create the first discussion topic
            </Text>
        </View>
    )

    const renderLoading = () => (
        <>
            {Array.from({ length: 3 }).map((_, i) => (
                <View
                    key={i}
                    className="bg-card border border-card-border rounded-xl p-4 mb-3"
                >
                    <View className="flex-row items-start gap-4">
                        <View className="bg-card dark:bg-card h-12 w-12 rounded-lg opacity-50" />
                        <View className="flex-1 space-y-3">
                            <View className="bg-card dark:bg-card h-5 w-48 rounded opacity-50" />
                            <View className="bg-card dark:bg-card h-4 w-full rounded opacity-50" />
                            <View className="bg-card dark:bg-card h-4 w-3/4 rounded opacity-50" />
                            <View className="bg-card dark:bg-card h-3 w-32 rounded opacity-50" />
                        </View>
                    </View>
                </View>
            ))}
        </>
    )

    return (
        <SafeAreaView className="flex-1 bg-background">
            <Header
                title="Discuss"
                showSearch={false}
                rightAction={
                    <Pressable
                        onPress={() => setShowCreate(!showCreate)}
                        className="p-2"
                    >
                        <Plus size={24} color={colors.primary} />
                    </Pressable>
                }
            />

            <ScrollView className="flex-1 px-6 py-4 bg-background">
                <Text className="text-text text-opacity-60 mb-4">
                    Join discussions on Burrow.
                </Text>

                {/* Create topic form */}
                {showCreate && (
                    <Card variant="bordered" className="mb-6">
                        <Text className="text-lg font-semibold text-text mb-4">
                            Create a new topic
                        </Text>

                        {mutation.isError && (
                            <ViewErrors
                                errors={`Failed to create topic: ${mutation.error}`}
                            />
                        )}

                        <Input
                            label="Name"
                            value={newName}
                            onChangeText={setNewName}
                            placeholder="Topic name..."
                            variant="outline"
                            maxLength={64}
                        />

                        <Input
                            label="Description (optional)"
                            value={newDescription}
                            onChangeText={setNewDescription}
                            placeholder="What's this topic about?"
                            variant="outline"
                            multiline
                            numberOfLines={3}
                            maxLength={256}
                        />

                        <View className="flex-row gap-3 mt-4">
                            <Button
                                variant="success"
                                onPress={handleCreateTopic}
                                disabled={
                                    newName.trim().length === 0 ||
                                    mutation.isPending
                                }
                                className="flex-1"
                            >
                                {mutation.isPending
                                    ? "Creating..."
                                    : "Create Topic"}
                            </Button>

                            <Button
                                variant="outline"
                                onPress={() => setShowCreate(false)}
                                disabled={mutation.isPending}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </View>
                    </Card>
                )}

                {/* Topics list */}
                {isError && <ViewErrors errors={`${error}`} />}

                {isLoading && renderLoading()}

                {!isLoading && data && data.length === 0 && renderEmpty()}

                {!isLoading && data && data.length > 0 && (
                    <View>
                        {data.map((topic) => (
                            <View key={topic.id}>
                                {renderTopic({ item: topic })}
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    )
}
