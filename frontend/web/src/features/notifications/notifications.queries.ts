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
} from "@features/notifications/notifications.api.ts"
import type { PaginatedResponse } from "@api/api.types.ts"
import type { Notification } from "@features/notifications/notifications.types.ts"

/**
 * Hook to fetch notifications with infinite scroll pagination
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
            if (lastPage.page < lastPage.totalPages) {
                return lastPage.page + 1
            }

            return undefined
        },
    })
}

/**
 * Hook to delete a single notification
 */
export function useDeleteNotification() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (notificationID: string) =>
            await deleteNotification(notificationID),

        onMutate: async (notificationId) => {
            // cancel request for notifications
            await queryClient.cancelQueries({ queryKey: ["notifications"] })

            // get previous
            const previousNotifications = queryClient.getQueryData<
                InfiniteData<PaginatedResponse<Notification>>
            >(["notifications"])

            // remove the deleted notification
            queryClient.setQueryData<
                InfiniteData<PaginatedResponse<Notification>>
            >(["notifications"], (old) => {
                if (!old) return old
                return {
                    ...old,
                    pages: old.pages.map((page) => ({
                        ...page,
                        contents: page.contents.filter(
                            (notification) => notification.id !== notificationId
                        ),
                        totalResults: page.totalResults - 1
                    }))
                }
            })

            return { previousNotifications }
        },

        onError: (_err, _notificationId, context) => {
            // rollback
            if (context?.previousNotifications) {
                queryClient.setQueryData(
                    ["notifications"],
                    context.previousNotifications
                )
            }
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

            // Optimistically update to toggle read status
            queryClient.setQueryData<
                InfiniteData<PaginatedResponse<Notification>>
            >(["notifications"], (old) => {
                if (!old) return old
                return {
                    ...old,
                    pages: old.pages.map((page) => ({
                        ...page,
                        contents: page.contents.map((notification) =>
                            notification.id === notificationId
                                ? { ...notification, read: !notification.read }
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
        }
    })
}
