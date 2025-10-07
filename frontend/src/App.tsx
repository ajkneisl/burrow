import { useEffect } from "react"
import { Route, Routes, useParams } from "react-router"
import HomeView from "@pages/home/Home.view.tsx"
import Meeting from "@pages/meetings/overview/Meeting.view.tsx"
import AllMeetings from "@pages/meetings/AllMeetings.view.tsx"
import LandingView from "@pages/landing/Landing.view.tsx"
import Settings from "@pages/settings/Settings.view.tsx"
import Header from "@features/layout/Header.tsx"
import About from "@pages/about/About.tsx"
import useUser from "@features/auth/api/hooks/useUser.ts"
import useToken from "@features/auth/api/hooks/useToken.ts"
import NotFound from "@pages/notfound/NotFound.view.tsx"
import { useAtom } from "jotai"

import "./index.css"
import Footer from "@features/layout/Footer.tsx"
import CreateStudyGroupModal from "@features/create/components/CreateStudyGroupModal.tsx"
import { studyGroupModal } from "@features/create/api/modal.atom.ts"
import { themeAtom } from "@api/theme.atom.ts"
import Privacy from "@pages/legal/Privacy.view.tsx"
import ToS from "@pages/legal/ToS.view.tsx"

function App() {
    // load user information & ensure logged in
    useUser()
    const auth = useToken()

    const [modalOpen, setModalOpen] = useAtom(studyGroupModal)
    const [darkMode, setDarkMode] = useAtom(themeAtom)

    useEffect(() => {
        const mq = window.matchMedia("(prefers-color-scheme: dark)")
        setDarkMode((prev) => {
            if (prev === null) return mq.matches
            else return prev
        })

        const handler = () => {
            setDarkMode((prev) => {
                if (prev === null) return mq.matches
                else return prev
            })
        }

        mq.addEventListener("change", handler)
        return () => mq.removeEventListener("change", handler)
    }, [darkMode, setDarkMode])

    useEffect(() => {
        const root = document.querySelector("html")

        if (root) {
            root.setAttribute("data-theme", darkMode ? "dark" : "light")
        }
    }, [darkMode])

    const MeetingReRoute = () => {
        const { id } = useParams()

        if (id?.length === 8) return <Meeting />
        else return <NotFound />
    }

    return (
        <div className="bg-background text-text min-h-screen w-full flex flex-col bg-background-color transition-colors duration-300">
            {auth !== null && <Header />}

            <main className="max-w-screen md:min-w-xl md:m-auto mb-8 mx-4 flex-grow">
                <CreateStudyGroupModal
                    open={modalOpen}
                    onClose={() => setModalOpen(false)}
                    title="Create a Study Group"
                />

                <Routes>
                    <Route path="/" element={<HomeView />} />

                    <Route path="/about" element={<About />} />

                    <Route path="/settings" element={<Settings />} />

                    <Route path="/welcome" element={<LandingView />} />

                    <Route
                        path="/study"
                        element={<AllMeetings type="STUDY" />}
                    />

                    <Route path="/meeting/:id" element={<Meeting />} />
                    <Route path="/:id" element={<MeetingReRoute />} />

                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/tos" element={<ToS />} />

                    <Route path="*" element={<NotFound />} />
                </Routes>
            </main>

            <Footer />
        </div>
    )
}

export default App
