import { Outlet, useNavigate } from "react-router"
import { Button } from "@umnburrow/core"
import { useAtom } from "jotai"
import {
    adminRefreshTokenAtom,
    adminTokenAtom
} from "../../auth/admin.atom.ts"
import { useEffect, useRef } from "react"
import useAdmin from "../../auth/hooks/useAdmin.ts"
import { refreshSession } from "../../auth/admin.api.ts"
import type { NavSection } from "../layout.models.ts"
import { SidebarSection } from "./SidebarSection.tsx"

/** How often to refresh the access token. Access tokens expire in 15 minutes. */
const REFRESH_INTERVAL_MS = 10 * 60 * 1000

function Layout() {
    const nav = useNavigate()
    const admin = useAdmin()

    const [token, setToken] = useAtom(adminTokenAtom)
    const [refreshToken, setRefreshToken] = useAtom(adminRefreshTokenAtom)

    useEffect(() => {
        if (token === "") {
            window.location.href = "https://umn.app"
        }
    }, [token, nav])

    // keep the access token fresh; refresh tokens rotate on each use,
    // so track the latest one in a ref instead of re-running the effect
    const refreshTokenRef = useRef(refreshToken)

    useEffect(() => {
        refreshTokenRef.current = refreshToken
    }, [refreshToken])

    useEffect(() => {
        const refresh = async () => {
            const current = refreshTokenRef.current
            if (!current) return

            try {
                const result = await refreshSession(current)

                setToken(result.token)
                setRefreshToken(result.refreshToken)
            } catch {
                setToken("")
                setRefreshToken("")
            }
        }

        refresh()

        const interval = setInterval(refresh, REFRESH_INTERVAL_MS)
        return () => clearInterval(interval)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const signOut = () => {
        setToken("")
        setRefreshToken("")
    }

    const SECTIONS: NavSection[] = [
        {
            title: "Dashboard",
            items: [
                {
                    label: "Overview",
                    href: "/dashboard",
                    color: "bg-secondary"
                },
                {
                    label: "Analytics",
                    href: "/analytics",
                    color: "bg-secondary"
                }
            ]
        },
        {
            title: "Moderation",
            items: [
                {
                    label: "Reports",
                    href: "/reports",
                    color: "bg-primary"
                }
            ]
        },
        {
            title: "Content",
            items: [
                {
                    label: "Articles",
                    href: "/articles",
                    color: "bg-secondary"
                }
            ]
        },
        {
            title: "System",
            items: [
                {
                    label: "Logs",
                    href: "/logs",
                    color: "bg-info"
                },
                {
                    label: "Administrators",
                    href: "/accounts",
                    color: "bg-info"
                }
            ]
        }
    ]

    return (
        <div className="min-h-screen w-full flex bg-background text-text transition-colors duration-300">
            {/* Sidebar */}
            <aside
                className="w-64 shrink-0 border-r border-card-border bg-card/50 backdrop-blur-sm supports-[backdrop-filter]:bg-card/40"
                aria-label="Primary navigation"
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="px-4 py-4 border-b border-card-border">
                        <div className="rounded-lg bg-card border border-card-border p-3">
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate text-sm">
                                    {admin?.username}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {admin?.email}
                                </p>
                            </div>
                        </div>

                        <div className="mt-3">
                            <Button
                                color="ERROR"
                                onClick={signOut}
                                className="w-full"
                            >
                                Sign Out
                            </Button>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
                        {SECTIONS.map((s) => (
                            <SidebarSection key={s.title} section={s} />
                        ))}
                    </nav>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto">
                <div className="w-full">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}

export default Layout
