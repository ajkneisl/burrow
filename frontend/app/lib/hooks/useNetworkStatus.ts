import { useEffect, useState } from "react"
import NetInfo from "@react-native-community/netinfo"

/**
 * Detect the current network status.
 *
 * @author AJ Kneisl
 */
export function useNetworkStatus() {
    const [isOnline, setIsOnline] = useState(true)

    useEffect(() => {
        // listen to network updates
        const unsubscribe = NetInfo.addEventListener((state) => {
            setIsOnline(state.isConnected ?? true)
        })

        // fetch the initial state
        NetInfo.fetch().then((state) => {
            setIsOnline(state.isConnected ?? true)
        })

        return () => {
            unsubscribe()
        }
    }, [])

    return isOnline
}
