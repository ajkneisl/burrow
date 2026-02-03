import Home from "@pages/Home.view.tsx"
import StandardBurrow from "@pages/burrows/StandardBurrow.view.tsx"
import ProjectBurrow from "@pages/burrows/ProjectBurrow.view.tsx"
import Browse from "@pages/burrows/Browse.view.tsx"
import LandingView from "@pages/Landing.view.tsx"
import About from "@pages/info/About.tsx"
import NotFound from "@pages/NotFound.view.tsx"
import Privacy from "@pages/info/Privacy.view.tsx"
import ToS from "@pages/info/ToS.view.tsx"
import SettingsView from "@pages/Settings.view.tsx"
import ProfileView from "@pages/Profile.view.tsx"
import Discuss from "@pages/Discuss.view.tsx"
import TopicView from "@pages/Topic.view.tsx"
import Friends from "@pages/Friends.view.tsx"
import History from "@pages/History.view.tsx"
import { createBrowserRouter, RouterProvider } from "react-router"
import Yordanos from "@pages/info/Yordanos.view.tsx"
import ErrorElement from "@pages/Error.view.tsx"
import BurrowRedirect from "@pages/burrows/Burrow.redirect.tsx"
import RootLayout from "@features/layout/components/RootLayout.tsx"
import { Provider } from "jotai"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { store } from "@api/api.atom.ts"
import { authToken } from "@features/auth/auth.atom.ts"
import { APIProvider } from "@vis.gl/react-google-maps"
import MapView from "@pages/Map.view.tsx"
import Delete from "@pages/info/Delete.view.tsx"
import TaView from "@pages/Ta.view.tsx"
import Support from "@pages/info/Support.view.tsx"

/**
 * This defines all routes in Burrow.
 */
const router = createBrowserRouter([
    {
        path: "/",
        element: <RootLayout />,
        errorElement: <ErrorElement />,
        children: [
            { index: true, element: <Home /> },
            { path: "about", element: <About /> },
            { path: "yord", element: <Yordanos /> },
            { path: "delete", element: <Delete /> },
            { path: "support", element: <Support /> },
            { path: "welcome", element: <LandingView /> },
            { path: "browse", element: <Browse /> },
            { path: "friends", element: <Friends /> },
            { path: "history", element: <History /> },
            { path: "map", element: <MapView /> },
            { path: "user/:username", element: <ProfileView /> },
            { path: "settings", element: <SettingsView /> },
            { path: "discuss", element: <Discuss /> },
            { path: "discuss/:id", element: <TopicView /> },
            { path: "privacy", element: <Privacy /> },
            { path: "tos", element: <ToS /> },
            { path: "ta", element: <TaView /> },
            { path: "burrow/:id", element: <StandardBurrow /> },
            { path: "project/:id", element: <ProjectBurrow /> },
            { path: ":id", element: <BurrowRedirect /> },
            { path: "*", element: <NotFound /> }
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
                <APIProvider apiKey={import.meta.env.VITE_GMAP_API_KEY}>
                    <div className="flex flex-row items-center justify-center">
                        <RouterProvider router={router} />
                    </div>
                </APIProvider>
            </QueryClientProvider>
        </Provider>
    )
}
