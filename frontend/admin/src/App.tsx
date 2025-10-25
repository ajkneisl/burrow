import { BrowserRouter, Route, Routes } from "react-router"
import { Card } from "@umnburrow/core"
import LoginView from "./pages/Login.view.tsx"
import { useAtom } from "jotai"
import { themeAtom } from "./theme.atom.ts"
import { useEffect } from "react"
import Admin from "./Admin.tsx"
import AnalyticsView from "./pages/Analytics.view.tsx"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import ReportsView from "./pages/Reports.view.tsx"
import SettingsView from "./pages/Settings.view.tsx"

const queryClient = new QueryClient()

export default function App() {
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

    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter basename="/admin">
                <Routes>
                    <Route path="/login" element={<LoginView />} />

                    <Route element={<Admin />}>
                        <Route
                            index
                            element={<Card className="p-6">Burrow Hello!</Card>}
                        />
                        <Route path="/analytics" element={<AnalyticsView />} />
                        <Route path="/reports" element={<ReportsView />} />
                        <Route path="/settings" element={<SettingsView />} />
                        <Route
                            path="*"
                            element={
                                <Card className="p-6">Page not found</Card>
                            }
                        />
                    </Route>
                </Routes>
            </BrowserRouter>
        </QueryClientProvider>
    )
}
