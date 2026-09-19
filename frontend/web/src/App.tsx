import Home from "@pages/Home.view.tsx"
import type { ComponentType } from "react"
import { createBrowserRouter, RouterProvider } from "react-router"
import ErrorElement from "@pages/Error.view.tsx"
import RootLayout from "@features/layout/components/RootLayout.tsx"
import { Provider } from "jotai"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { store } from "@api/api.atom.ts"
import { authToken } from "@features/auth/auth.atom.ts"

/**
 * Load a page's code only when its route is visited.
 */
const page = (load: () => Promise<{ default: ComponentType }>) => async () => ({
    Component: (await load()).default
})

/**
 * This defines all routes in Burrow.
 */
const router = createBrowserRouter([
    {
        path: "/",
        element: <RootLayout />,
        errorElement: <ErrorElement />,
        HydrateFallback: () => null,
        children: [
            { index: true, element: <Home /> },
            {
                path: "about",
                lazy: page(() => import("@pages/info/About.view.tsx"))
            },
            {
                path: "yord",
                lazy: page(() => import("@pages/info/Yordanos.view.tsx"))
            },
            {
                path: "delete",
                lazy: page(() => import("@pages/info/Delete.view.tsx"))
            },
            {
                path: "support",
                lazy: page(() => import("@pages/info/Support.view.tsx"))
            },
            {
                path: "welcome",
                lazy: page(() => import("@pages/Landing.view.tsx"))
            },
            {
                path: "login",
                lazy: page(() => import("@pages/Login.view.tsx"))
            },
            {
                path: "browse",
                lazy: page(() => import("@pages/burrows/Browse.view.tsx"))
            },
            {
                path: "friends",
                lazy: page(() => import("@pages/user/Friends.view.tsx"))
            },
            {
                path: "history",
                lazy: page(() => import("@pages/user/History.view.tsx"))
            },
            { path: "map", lazy: page(() => import("@pages/Map.view.tsx")) },
            {
                path: "user/:username",
                lazy: page(() => import("@pages/Profile.view.tsx"))
            },
            {
                path: "settings",
                lazy: page(() => import("@pages/user/Settings.view.tsx"))
            },
            {
                path: "discuss",
                lazy: page(() => import("@pages/Discuss.view.tsx"))
            },
            {
                path: "discuss/:id",
                lazy: page(() => import("@pages/Topic.view.tsx"))
            },
            {
                path: "privacy",
                lazy: page(() => import("@pages/info/Privacy.view.tsx"))
            },
            {
                path: "tos",
                lazy: page(() => import("@pages/info/ToS.view.tsx"))
            },
            {
                path: "burrow/:id",
                lazy: page(
                    () => import("@pages/burrows/StandardBurrow.view.tsx")
                )
            },
            {
                path: "project/:id",
                lazy: page(
                    () => import("@pages/burrows/ProjectBurrow.view.tsx")
                )
            },
            {
                path: "clubs",
                lazy: page(() => import("@pages/clubs/MyClubs.view.tsx"))
            },
            {
                path: "clubs/browse",
                lazy: page(() => import("@pages/clubs/BrowseClubs.view.tsx"))
            },
            {
                path: "club/:name",
                lazy: page(() => import("@pages/clubs/Club.view.tsx"))
            },
            {
                path: "club/:name/history",
                lazy: page(() => import("@pages/clubs/ClubHistory.view.tsx"))
            },
            {
                path: "articles",
                lazy: page(() => import("@pages/Articles.view.tsx"))
            },
            {
                path: "article/:slug",
                lazy: page(() => import("@pages/Article.view.tsx"))
            },
            {
                path: ":id",
                lazy: page(() => import("@pages/burrows/Burrow.redirect.tsx"))
            },
            { path: "*", lazy: page(() => import("@pages/NotFound.view.tsx")) }
        ]
    }
])

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            enabled: () => store.get(authToken) !== ""
        }
    }
})

/**
 * @author AJ Kneisl
 */
export default function App() {
    return (
        <Provider store={store}>
            <QueryClientProvider client={queryClient}>
                <div className="flex flex-row items-center justify-center">
                    <RouterProvider router={router} />
                </div>
            </QueryClientProvider>
        </Provider>
    )
}
