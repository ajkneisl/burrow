import { useState } from "react"
import { View, Alert } from "react-native"
import { useRouter } from "expo-router"
import { useQueryClient } from "@tanstack/react-query"
import { Pencil, Trash2 } from "lucide-react-native"
import Toast from "react-native-toast-message"
import { useThemeColors } from "@api/theme/useThemeColors"
import { Button, Text } from "@components/core"
import type { ClubResponse } from "@features/clubs/club.types"
import EditClubModal from "@features/clubs/components/EditClubModal"
import useClubRole from "@features/clubs/hooks/useClubRole"
import { deleteClub } from "@features/clubs/clubs.api"

/**
 * {@link ClubModeration}
 */
type ClubModerationProps = {
    clubResponse: ClubResponse
}

/**
 * A club's moderation.
 *
 * @param clubResponse The club's response
 * @author AJ Kneisl
 */
export default function ClubModeration({ clubResponse }: ClubModerationProps) {
    const { isOwner, isAdmin } = useClubRole(clubResponse.club.name)

    const router = useRouter()
    const queryClient = useQueryClient()
    const colors = useThemeColors()

    const [editOpen, setEditOpen] = useState(false)

    const onDelete = async () => {
        try {
            await deleteClub(clubResponse.club.name)

            void queryClient.invalidateQueries({
                queryKey: ["myClubs"]
            })

            Toast.show({
                type: "success",
                text1: "Club deleted."
            })
            router.back()
        } catch (error) {
            Toast.show({
                type: "error",
                text1:
                    typeof error === "string" ? error : "Failed to delete club."
            })
        }
    }

    function handleDeletePress() {
        Alert.alert(
            "Delete Club",
            `Are you sure you want to delete ${clubResponse.club.displayName}? This action cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: onDelete
                }
            ]
        )
    }

    if (!isAdmin && !isOwner) return null

    return (
        <>
            {isAdmin && (
                <Button
                    variant="secondary"
                    size="sm"
                    onPress={() => setEditOpen(true)}
                >
                    <View className="flex-row items-center gap-1.5">
                        <Pencil size={14} color={colors.text} />
                        <Text className="text-text font-semibold text-sm">
                            Edit
                        </Text>
                    </View>
                </Button>
            )}

            {isOwner && (
                <Button variant="danger" size="sm" onPress={handleDeletePress}>
                    <View className="flex-row items-center gap-1.5">
                        <Trash2 size={14} color="#fff" />
                        <Text className="text-white font-semibold text-sm">
                            Delete
                        </Text>
                    </View>
                </Button>
            )}

            {isAdmin && (
                <EditClubModal
                    visible={editOpen}
                    onClose={() => setEditOpen(false)}
                    club={clubResponse.club}
                />
            )}
        </>
    )
}
