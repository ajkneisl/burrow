import { configureApi } from "@umnburrow/core/api"
import { authToken, refreshTokenAtom } from "@features/auth/auth.atom.ts"
import { store } from "@api/api.atom.ts"
import { BASE_URL, CDN_URL } from "@api/util.ts"

/**
 * Point the shared API layer at the web client's cookie-backed session.
 * Imported for its side effect before anything renders.
 */
configureApi({
    baseUrl: BASE_URL,
    cdnUrl: CDN_URL,
    getToken: () => store.get(authToken),
    getRefreshToken: () => store.get(refreshTokenAtom),
    setToken: (token) => store.set(authToken, token),
    setRefreshToken: (token) => store.set(refreshTokenAtom, token)
})
