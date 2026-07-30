import { followUser, getDiscoveredUsers, getRelations, unfollowUser } from "@umnburrow/core/api"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import Toast from "react-native-toast-message"

export function useFriendsQuery() {
    return useQuery({
        queryKey: ["relations", "friends"],
        queryFn: () => getRelations("friends")
    })
}

export function useFollowingQuery() {
    return useQuery({
        queryKey: ["relations", "following"],
        queryFn: () => getRelations("following")
    })
}

export function useFollowersQuery() {
    return useQuery({
        queryKey: ["relations", "followers"],
        queryFn: () => getRelations("followers")
    })
}

export function useDiscoverQuery() {
    return useQuery({
        queryKey: ["relations", "discover"],
        queryFn: () => getDiscoveredUsers()
    })
}

export function useFollowMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: followUser,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["relations"] })
            Toast.show({ type: "success", text1: "Followed successfully" })
        },
        onError: (error: any) => {
            Toast.show({
                type: "error",
                text1: "Failed to follow",
                text2: error.message || "Please try again"
            })
        }
    })
}

export function useUnfollowMutation() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: unfollowUser,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["relations"] })
            Toast.show({ type: "success", text1: "Unfollowed successfully" })
        },
        onError: (error: any) => {
            Toast.show({
                type: "error",
                text1: "Failed to unfollow",
                text2: error.message || "Please try again"
            })
        }
    })
}
