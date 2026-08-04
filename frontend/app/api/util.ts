import { atomWithStorage } from "jotai/utils"
import AsyncStorage from "@react-native-async-storage/async-storage"
import Constants from "expo-constants"

/**
 * Platform specific glue for the mobile client. Everything shared with the web
 * client and the admin panel — the request client, the models and the
 * formatting helpers — lives in `@umnburrow/core/api`.
 */

export const BASE_URL =
    Constants.expoConfig?.extra?.apiUrl || "https://umn.app/api"
export const CDN_URL =
    Constants.expoConfig?.extra?.cdnUrl || "https://cdn.umn.app"

/**
 * AsyncStorage wrapper for Jotai atoms (React Native equivalent of atomWithCookie)
 *
 * @param key The storage key.
 * @param initialValue The initial value.
 */
export function atomWithAsyncStorage<T extends string>(
    key: string,
    initialValue: T
) {
    return atomWithStorage<T>(`storage:${key}`, initialValue, {
        getItem: async (storageKey: string) => {
            try {
                const value = await AsyncStorage.getItem(key)
                return (value as T) ?? initialValue
            } catch (error) {
                console.error(`Error reading AsyncStorage key "${key}":`, error)
                return initialValue
            }
        },
        setItem: async (storageKey: string, value: T) => {
            try {
                await AsyncStorage.setItem(key, value as unknown as string)
            } catch (error) {
                console.error(`Error writing AsyncStorage key "${key}":`, error)
            }
        },
        removeItem: async (storageKey: string) => {
            try {
                await AsyncStorage.removeItem(key)
            } catch (error) {
                console.error(
                    `Error removing AsyncStorage key "${key}":`,
                    error
                )
            }
        },
        subscribe: (storageKey: string, callback: (value: T) => void) => {
            // AsyncStorage doesn't have native subscription support
            // For now, we'll use polling (can be improved with event emitters if needed)
            let stopped = false
            let prev: string | null | undefined

            const tick = async () => {
                if (stopped) return
                try {
                    const curr = await AsyncStorage.getItem(key)
                    if (curr !== prev) {
                        prev = curr
                        if (curr !== null) callback(curr as T)
                    }
                } finally {
                    if (!stopped) setTimeout(tick, 1000)
                }
            }

            // kick off polling
            void tick()

            // cleanup
            return () => {
                stopped = true
            }
        }
    })
}
