import { BrowserRouter, Navigate, Route, Routes } from "react-router"
import { Card } from "@umnburrow/core"
import LoginView from "./pages/Login.view.tsx"
import { useAtom } from "jotai"
import { themeAtom } from "./theme.atom.ts"
import { useEffect } from "react"
import Layout from "./features/layout/components/Layout.tsx"
import AnalyticsView from "./pages/Analytics.view.tsx"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import ReportsView from "./pages/Reports.view.tsx"
import LogsView from "./pages/Logs.view.tsx"
import Home from "./pages/Home.view.tsx"
import BadgesView from "./pages/Badges.view.tsx";
import ArticlesView from "./pages/Articles.view.tsx";
import AccountsView from "./pages/Accounts.view.tsx";

const queryClient = new QueryClient()

/**
 * The app
 */
export default function App() {
    const [darkMode, setDarkMode] = useAtom(themeAtom)

    // detect theme
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

                    <Route element={<Layout />}>
                        <Route
                            index
                            element={<Navigate to="/dashboard" replace />}
                        />
                        <Route path="/dashboard" element={<Home />} />
                        <Route path="/analytics" element={<AnalyticsView />} />
                        <Route path="/reports" element={<ReportsView />} />
                        <Route path="/logs" element={<LogsView />} />
                        <Route path="/badges" element={<BadgesView />} />
                        <Route path="/articles" element={<ArticlesView />} />
                        <Route path="/accounts" element={<AccountsView />} />

                        <Route
                            path="*"
                            element={
                                <div className="p-6">
                                    <Card className="p-6">
                                        <h1 className="text-2xl font-bold mb-2">
                                            Page not found
                                        </h1>
                                        <p className="text-muted-foreground">
                                            The page you're looking for doesn't
                                            exist.
                                        </p>
                                    </Card>
                                </div>
                            }
                        />
                    </Route>
                </Routes>
            </BrowserRouter>
        </QueryClientProvider>
    )
}
