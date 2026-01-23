import { useAtom, useSetAtom } from "jotai"
import useUser from "@features/auth/hooks/useUser.ts"
import { createBurrowModal } from "@features/burrows/create/create.atom.ts"
import { themeAtom } from "@api/theme/theme.atom.ts"
import { getTheme } from "@api/theme/theme.api.ts"
import { useEffect, useMemo } from "react"
import { Outlet, useLocation } from "react-router"
import MetaTags from "@features/layout/components/MetaTags.tsx"
import Header from "@features/layout/components/Header.tsx"
import { Toaster } from "react-hot-toast"
import CreateStudyBurrowModal from "@features/burrows/create/components/study/CreateStudyBurrowModal.tsx"
import { createBurrow } from "@features/burrows/create/create.api.ts"
import CreateEventBurrowModal from "@features/burrows/create/components/event/CreateEventBurrowModal.tsx"
import CreateProjectBurrowModal from "@features/burrows/create/components/project/CreateProjectBurrowModal.tsx"
import ViewRelations from "@features/profile/components/ViewRelations.tsx"
import ReportProblemModal from "@features/report/components/ReportProblemModal.tsx"
import MyInvitesModal from "@features/layout/components/MyInvitesModal.tsx"
import Footer from "@features/layout/components/Footer.tsx"
import { searchQueryAtom } from "@features/layout/search/search.atom.ts"

/**
 * The base layout that's rendered for all pages.
 *
 * This handles dark mode stuff.
 *
 * @author AJ Kneisl
 */
export default function RootLayout() {
    // load user information & ensure logged in
    const user = useUser()

    const [createModal, setCreateModal] = useAtom(createBurrowModal)
    const [theme, setTheme] = useAtom(themeAtom)
    const setQuery = useSetAtom(searchQueryAtom)

    // fetch theme from backend in background and update local storage if different
    useEffect(() => {
        async function loadTheme() {
            const loadedTheme = await getTheme()

            if (theme !== loadedTheme) setTheme(loadedTheme)
        }

        // if signed in, load the them
        if (user) {
            void loadTheme()
        }
    }, [user])

    // compute actual dark mode based on theme setting
    const computedTheme = useMemo(() => {
        if (theme === "AUTO") {
            return window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "DARK"
                : "LIGHT"
        }

        return theme
    }, [theme])

    // go to top on page refresh
    const location = useLocation()
    useEffect(() => {
        if (!location.hash) {
            window.scrollTo({ top: 0, left: 0, behavior: "instant" })

            // reset search query on page change
            setQuery("")
        }
    }, [location.hash, location.pathname, setQuery])

    useEffect(() => {
        const root = document.querySelector("html")
        if (root) root.setAttribute("data-theme", computedTheme)
    }, [computedTheme])

    return (
        <div className="gopher-stand text-text flex min-h-screen w-full flex-col bg-transparent transition-colors duration-300">
            {/* meta helmet*/}
            <MetaTags />

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

            <main className="mb-8 flex-grow md:m-auto md:mx-4 md:min-w-xl">
                {/* study creation */}
                <CreateStudyBurrowModal
                    open={createModal === "STUDY"}
                    onClose={() => setCreateModal(null)}
                    mode="create"
                    modalTitle={"Create a Study Burrow"}
                    onSubmit={async (payload) => {
                        return await createBurrow(payload)
                    }}
                />

                {/* event creation */}
                <CreateEventBurrowModal
                    open={createModal === "EVENT"}
                    onClose={() => setCreateModal(null)}
                    mode="create"
                    modalTitle={"Create an Event Burrow"}
                    onSubmit={async (payload) => {
                        return await createBurrow(payload)
                    }}
                />

                {/* group creation */}
                <CreateProjectBurrowModal
                    open={createModal === "PROJECT"}
                    onClose={() => setCreateModal(null)}
                    mode="create"
                    modalTitle={"Create an Project Burrow"}
                    onSubmit={async (payload) => {
                        return await createBurrow(payload)
                    }}
                />

                {/* view relations */}
                <ViewRelations />

                {/* report a problem*/}
                <ReportProblemModal />

                {/* my invites*/}
                <MyInvitesModal />

                {/* actual page */}
                <Outlet />
            </main>

            <Footer />
        </div>
    )
}
