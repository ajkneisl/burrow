import {
    useMutation,
    useQueryClient,
    useInfiniteQuery,
    type InfiniteData
} from "@tanstack/react-query"
import {
    getNotifications,
    deleteNotification,
    clearNotifications,
    toggleReadNotification
} from "@features/notifications/notifications.api"
import type { PaginatedResponse } from "@api/api.types"
import type { Notification } from "@features/notifications/notifications.types"
import Toast from "react-native-toast-message"

/**
 * Fetch notifications.
 */
export function useNotificationsQuery() {
    return useInfiniteQuery<PaginatedResponse<Notification>>({
        queryKey: ["notifications"],
        initialPageParam: 1,
        staleTime: 1000 * 60, // 1 minute

        queryFn: async ({ pageParam }) => {
            return await getNotifications(pageParam as number)
        },

        getNextPageParam: (lastPage) => {
            if (lastPage && lastPage?.page < lastPage?.totalPages) {
                return lastPage.page + 1
            }

            return undefined
        }
    })
}

/**
 * Delete a notification.
 */
export function useDeleteNotification() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (notificationID: string) =>
            await deleteNotification(notificationID),

        onMutate: async (notificationId) => {
            await queryClient.cancelQueries({ queryKey: ["notifications"] })

            const previousNotifications = queryClient.getQueryData<
                InfiniteData<PaginatedResponse<Notification>>
            >(["notifications"])

            queryClient.setQueryData<
                InfiniteData<PaginatedResponse<Notification>>
            >(["notifications"], (old) => {
                if (!old) return old
                return {
                    ...old,
                    pages: old.pages.map((page) => ({
                        ...page,
                        contents: page.contents.filter(
                            (notification: Notification) =>
                                notification.id !== notificationId
                        ),
                        totalResults: page.totalResults - 1
                    }))
                }
            })

            return { previousNotifications }
        },

        onError: (_err, _notificationId, context) => {
            if (context?.previousNotifications) {
                queryClient.setQueryData(
                    ["notifications"],
                    context.previousNotifications
                )
            }

            Toast.show({
                type: "error",
                text1: "Failed to clear notification"
            })
        },

        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: ["notifications"] })
        }
    })
}

/**
 * Hook to toggle read status on a notification
 */
export function useToggleReadNotification() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (notificationID: string) =>
            await toggleReadNotification(notificationID),

        onMutate: async (notificationId) => {
            await queryClient.cancelQueries({ queryKey: ["notifications"] })

            const previousNotifications = queryClient.getQueryData<
                InfiniteData<PaginatedResponse<Notification>>
            >(["notifications"])

            queryClient.setQueryData<
                InfiniteData<PaginatedResponse<Notification>>
            >(["notifications"], (old) => {
                if (!old) return old
                return {
                    ...old,
                    pages: old.pages.map((page) => ({
                        ...page,
                        contents: page.contents.map(
                            (notification: Notification) =>
                                notification.id === notificationId
                                    ? {
                                          ...notification,
                                          read: !notification.read
                                      }
                                    : notification
                        )
                    }))
                }
            })

            return { previousNotifications }
        },

        onError: (_err, _notificationId, context) => {
            if (context?.previousNotifications) {
                queryClient.setQueryData(
                    ["notifications"],
                    context.previousNotifications
                )
            }
            Toast.show({
                type: "error",
                text1: "Failed to update notification"
            })
        },

        onSettled: () => {
            void queryClient.invalidateQueries({ queryKey: ["notifications"] })
        }
    })
}

/**
 * Hook to clear all notifications
 */
export function useClearAllNotifications() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async () => await clearNotifications(),

        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["notifications"] })

            Toast.show({
                type: "success",
                text1: "All notifications cleared"
            })
        },

        onError: () => {
            Toast.show({
                type: "error",
                text1: "Failed to clear notifications"
            })
        }
    })
}
