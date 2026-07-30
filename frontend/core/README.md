# @umnburrow/core

Shared code for the three Burrow clients — the web app (`frontend/web`), the
mobile app (`frontend/app`) and the admin panel (`frontend/admin`).

The package has two entry points.

## `@umnburrow/core`

The React component library: `Button`, `Card`, `Modal`, `Input`, `Paginator`
and friends. Web only — it depends on `react-aria-components` and
`lucide-react`.

```ts
import { Button, Card } from "@umnburrow/core"
import "@umnburrow/core/style.css"
```

## `@umnburrow/core/api`

Every call the clients make to the backend, the models those calls return, and
the formatting helpers shared between them. This entry point touches no React,
no DOM and no React Native, so the mobile app consumes it too.

Configure it once at startup, before anything renders:

```ts
import { configureApi } from "@umnburrow/core/api"

configureApi({
    baseUrl: import.meta.env.VITE_BASE_URL,
    cdnUrl: import.meta.env.VITE_CDN_URL,
    getToken: () => store.get(authToken),
    getRefreshToken: () => store.get(refreshTokenAtom),
    setToken: (token) => store.set(authToken, token),
    setRefreshToken: (token) => store.set(refreshTokenAtom, token)
})
```

Each client keeps its own session storage — cookies on web, AsyncStorage on
mobile, `localStorage` on admin — and hands the API layer the accessors. The
client attaches the bearer token, refreshes it once on a `401` and retries the
original request.

Then call the endpoints directly; the token is never passed by hand:

```ts
import { getBurrow, joinBurrow, type BurrowResponse } from "@umnburrow/core/api"

const response: BurrowResponse = await getBurrow(id)
await joinBurrow(id)
```

The models mirror the Kotlin models in `backend/src/main/kotlin`. When a route
or a payload changes on the backend, change it here — not in the clients.

## Development

```sh
bun run build   # type check, bundle both entries, emit .d.ts
bun run dev     # rebuild on change
./bump_publish.sh
```

The clients depend on a published version, so a change here has to be
published before they can pick it up.
