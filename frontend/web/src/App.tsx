import HomeView from "@pages/Home.view.tsx"
import Meeting from "@pages/Meeting.view.tsx"
import AllMeetings from "@pages/AllMeetings.view.tsx"
import LandingView from "@pages/Landing.view.tsx"
import Header from "@features/layout/components/Header.tsx"
import About from "@pages/About.tsx"
import useUser from "@features/auth/hooks/useUser.ts"
import NotFound from "@pages/NotFound.view.tsx"
import { useAtom } from "jotai"
import Footer from "@features/layout/components/Footer.tsx"
import CreateStudyGroupModal from "@features/create/components/CreateStudyGroupModal.tsx"
import { studyGroupModal } from "@features/create/create.atom.ts"
import { themeAtom } from "@api/theme.atom.ts"
import Privacy from "@pages/Privacy.view.tsx"
import ToS from "@pages/ToS.view.tsx"
import { Toaster } from "react-hot-toast"
import SettingsModal from "@features/sync/settings/SettingsModal.tsx"
import ReportProblemModal from "@features/problem/components/ReportProblemModal.tsx"
import ProfileView from "@pages/Profile.view.tsx"
import { useEffect } from "react"
import {
    createBrowserRouter,
    Outlet,
    RouterProvider,
    useParams,
    useRouteError
} from "react-router"

function ErrorElement() {
    const error = useRouteError() as Error | undefined
    return (
        <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-error">
                Something went wrong
            </h1>
            <p className="mt-2 opacity-70">
                {error?.message || "An unexpected error occurred."}
            </p>
        </div>
    )
}

function MeetingReRoute() {
    const { id } = useParams()
    if (id && id.length === 8) return <Meeting />
    return <NotFound />
}

function RootLayout() {
    // load user information & ensure logged in
    useUser()

    const [modalOpen, setModalOpen] = useAtom(studyGroupModal)
    const [darkMode, setDarkMode] = useAtom(themeAtom)

    useEffect(() => {
        const mq = window.matchMedia("(prefers-color-scheme: dark)")
        setDarkMode((prev) => (prev === null ? mq.matches : prev))
        const handler = () =>
            setDarkMode((prev) => (prev === null ? mq.matches : prev))
        mq.addEventListener("change", handler)
        return () => mq.removeEventListener("change", handler)
    }, [setDarkMode])

    useEffect(() => {
        const root = document.querySelector("html")
        if (root) root.setAttribute("data-theme", darkMode ? "dark" : "light")
    }, [darkMode])

    return (
        <div className="gopher-stand bg-transparent text-text min-h-screen w-full flex flex-col transition-colors duration-300">
            {/* don't show header on welcome */}
            {window.location.pathname !== "/welcome" && <Header />}

            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: "var(--card-background-color)",
                        color: "var(--text-color",
                        border: "1px solid var(--hero-color)",
                        borderRadius: "0.75rem",
                        padding: "0.75rem 1rem"
                    }
                }}
            />

            <main className="max-w-screen md:min-w-xl md:m-auto mb-8 mx-4 flex-grow">
                <CreateStudyGroupModal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    title="Create a Study Group"
                />

                <ReportProblemModal />
                <SettingsModal />

                {/* Child routes render here */}
                <Outlet />
            </main>

            <Footer />
        </div>
    )
}

const router = createBrowserRouter([
    {
        path: "/",
        element: <RootLayout />,
        errorElement: <ErrorElement />,
        children: [
            { index: true, element: <HomeView /> },
            { path: "about", element: <About /> },
            { path: "welcome", element: <LandingView /> },
            { path: "study", element: <AllMeetings type="STUDY" /> },
            { path: "user/:username", element: <ProfileView /> },
            { path: "privacy", element: <Privacy /> },
            { path: "tos", element: <ToS /> },
            { path: "*", element: <NotFound /> },
            { path: "meeting/:id", element: <Meeting /> },
            { path: ":id", element: <MeetingReRoute /> },
        ]
    }
])

function App() {
    return <RouterProvider router={router} />
}

export default App
