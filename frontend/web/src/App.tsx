import HomeView from "@pages/Home.view.tsx"
import StandardBurrow from "@pages/burrows/StandardBurrow.view.tsx"
import ProjectBurrow from "@pages/burrows/ProjectBurrow.view.tsx"
import Browse from "@pages/burrows/Browse.view.tsx"
import LandingView from "@pages/Landing.view.tsx"
import About from "@pages/About.tsx"
import NotFound from "@pages/NotFound.view.tsx"
import Privacy from "@pages/Privacy.view.tsx"
import ToS from "@pages/ToS.view.tsx"
import SettingsView from "@pages/Settings.view.tsx"
import ProfileView from "@pages/Profile.view.tsx"
import Discuss from "@pages/Discuss.view.tsx"
import TopicView from "@pages/Topic.view.tsx"
import { createBrowserRouter, RouterProvider } from "react-router"
import Yordanos from "@pages/Yordanos.view.tsx"
import ErrorElement from "@pages/Error.view.tsx"
import BurrowRedirect from "@pages/burrows/Burrow.redirect.tsx"
import RootLayout from "@features/layout/components/RootLayout.tsx"
import { Provider } from "jotai"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { store } from "@api/api.atom.ts"
import CreatorsView from "@pages/creators.view.tsx"

/**
 * This defines all routes in Burrow.
 */
const router = createBrowserRouter([
    {
        path: "/",
        element: <RootLayout />,
        errorElement: <ErrorElement />,
        children: [
            { index: true, element: <HomeView /> },
            { path: "about", element: <About /> },
            { path: "yord", element: <Yordanos /> },
            { path: "welcome", element: <LandingView /> },
            { path: "browse", element: <Browse /> },
            { path: "user/:username", element: <ProfileView /> },
            { path: "settings", element: <SettingsView /> },
            { path: "discuss", element: <Discuss /> },
            { path: "discuss/:id", element: <TopicView /> },
            { path: "privacy", element: <Privacy /> },
            { path: "tos", element: <ToS /> },
            { path: "burrow/:id", element: <StandardBurrow /> },
            { path: "project/:id", element: <ProjectBurrow /> },
            { path: ":id", element: <BurrowRedirect /> },
            { path: "*", element: <NotFound /> }
        ]
    }
])

const queryClient = new QueryClient()

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
