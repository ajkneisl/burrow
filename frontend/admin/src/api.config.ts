import { configureApi } from "@umnburrow/core/api"
import { getDefaultStore } from "jotai"
import {
    BASE_URL,
    CDN_URL,
    adminRefreshTokenAtom,
    adminTokenAtom
} from "./features/auth/admin.atom.ts"

const store = getDefaultStore()

/**
 * Point the shared API layer at the admin panel's session. Imported for its
 * side effect before anything renders.
 */
configureApi({
    baseUrl: BASE_URL,
    cdnUrl: CDN_URL,
    getToken: () => store.get(adminTokenAtom),
    getRefreshToken: () => store.get(adminRefreshTokenAtom),
    setToken: (token) => store.set(adminTokenAtom, token),
    setRefreshToken: (token) => store.set(adminRefreshTokenAtom, token)
})
