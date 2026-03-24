import { useState } from "react"
import { Pressable, Alert } from "react-native"
import { useRouter } from "expo-router"
import { useQueryClient } from "@tanstack/react-query"
import { Pencil, Trash2 } from "lucide-react-native"
import Toast from "react-native-toast-message"
import { useThemeColors } from "@api/theme/useThemeColors"
import type { ClubResponse } from "@features/clubs/club.types"
import EditClubModal from "@features/clubs/components/EditClubModal"
import useClubRole from "@features/clubs/hooks/useClubRole"
import { deleteClub } from "@features/clubs/clubs.api"

type ClubModerationProps = {
    clubResponse: ClubResponse
}

/**
 * Club moderation icons for the header — edit (pencil) and delete (trash).
 * Only visible to admins/owners.
 *
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
            void queryClient.invalidateQueries({ queryKey: ["myClubs"] })
            Toast.show({ type: "success", text1: "Club deleted." })
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
                { text: "Delete", style: "destructive", onPress: onDelete }
            ]
        )
    }

    if (!isAdmin && !isOwner) return null

    return (
        <>
            {isAdmin && (
                <Pressable
                    onPress={() => setEditOpen(true)}
                    hitSlop={12}
                    className="p-2"
                >
                    <Pencil size={20} color={colors.text} />
                </Pressable>
            )}

            {isOwner && (
                <Pressable
                    onPress={handleDeletePress}
                    hitSlop={12}
                    className="p-2"
                >
                    <Trash2 size={20} color={colors.error} />
                </Pressable>
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
