import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
    getNotificationPreferences,
    saveNotificationPreferences,
    getGeneralSettings,
    saveGeneralSettings
} from "./settings.api"
import type { NotificationPreferences, GeneralSettings } from "./settings.types"
import Toast from "react-native-toast-message"

/**
 * Hook to fetch notification preferences.
 */
export function useNotificationPreferences() {
    return useQuery<NotificationPreferences[]>({
        queryKey: ["settings", "notifications"],
        queryFn: getNotificationPreferences,
        staleTime: 1000 * 60 * 5 // 5 minutes
    })
}

/**
 * Hook to save notification preferences.
 */
export function useSaveNotificationPreferences() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: saveNotificationPreferences,

        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: ["settings", "notifications"]
            })

            Toast.show({
                type: "success",
                text1: "Notification preferences saved"
            })
        },

        onError: () => {
            Toast.show({
                type: "error",
                text1: "Failed to save preferences"
            })
        }
    })
}

/**
 * Hook to fetch general settings.
 */
export function useGeneralSettings() {
    return useQuery<GeneralSettings>({
        queryKey: ["settings", "general"],
        queryFn: getGeneralSettings,
        staleTime: 1000 * 60 * 5 // 5 minutes
    })
}

/**
 * Hook to save general settings.
 */
export function useSaveGeneralSettings() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: saveGeneralSettings,

        onMutate: async (newSettings) => {
            // Cancel outgoing queries
            await queryClient.cancelQueries({
                queryKey: ["settings", "general"]
            })

            // Snapshot previous value
            const previousSettings =
                queryClient.getQueryData<GeneralSettings>(["settings", "general"])

            // Optimistically update
            queryClient.setQueryData<GeneralSettings>(
                ["settings", "general"],
                newSettings
            )

            return { previousSettings }
        },

        onError: (_err, _newSettings, context) => {
            // Rollback on error
            if (context?.previousSettings) {
                queryClient.setQueryData(
                    ["settings", "general"],
                    context.previousSettings
                )
            }

            Toast.show({
                type: "error",
                text1: "Failed to save settings"
            })
        },

        onSettled: () => {
            void queryClient.invalidateQueries({
                queryKey: ["settings", "general"]
            })
        },

        onSuccess: () => {
            Toast.show({
                type: "success",
                text1: "Settings saved"
            })
        }
    })
}
