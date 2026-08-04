import { configureApi } from "@umnburrow/core/api"
import { store } from "@api/api.atom"
import { authToken, refreshTokenAtom } from "@features/auth/auth.atom"
import { BASE_URL, CDN_URL } from "@api/util"

/**
 * Point the shared API layer at the mobile client's AsyncStorage-backed
 * session. Imported for its side effect before anything renders.
 */
configureApi({
    baseUrl: BASE_URL,
    cdnUrl: CDN_URL,
    // mobile networks can stall indefinitely, so requests get a hard ceiling
    timeoutMs: 30_000,
    getToken: () => store.get(authToken),
    getRefreshToken: () => store.get(refreshTokenAtom),
    setToken: (token) => store.set(authToken, token),
    setRefreshToken: (token) => store.set(refreshTokenAtom, token)
})
