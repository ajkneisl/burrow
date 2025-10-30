import { Outlet, useNavigate } from "react-router"
import { Button } from "@umnburrow/core"
import { useAtom } from "jotai"
import { adminTokenAtom } from "../../auth/admin.atom.ts"
import { useEffect } from "react"
import useAdmin from "../../auth/hooks/useAdmin.ts"
import type { NavSection } from "../layout.models.ts"
import { SidebarSection } from "./SidebarSection.tsx"

function Layout() {
    const nav = useNavigate()
    const admin = useAdmin()

    const [token, setToken] = useAtom(adminTokenAtom)

    useEffect(() => {
        if (token === "") {
            window.location.href = "https://umn.app"
        }
    }, [token, nav])

    const SECTIONS: NavSection[] = [
        {
            title: "Overview",
            items: [
                {
                    label: "Analytics",
                    href: "/admin/analytics",
                    color: "bg-secondary"
                }
            ]
        },
        {
            title: "Reports",
            items: [
                {
                    label: "All Reports",
                    href: "/admin/reports",
                    color: "bg-primary"
                }
            ]
        }
    ]

    return (
        <div className="min-h-screen w-full flex bg-background text-text transition-colors duration-300">
            {/* side bar */}
            <aside
                className="w-72 shrink-0 border-r border-card-border bg-card/70 bg-gradient-to-b from-card to-transparent backdrop-blur supports-[backdrop-filter]:bg-card/60"
                aria-label="Primary"
            >
                <div className="px-4 py-5 border-b border-card-border">
                    <button
                        type="button"
                        className="w-full flex items-center gap-3 rounded-xl p-3 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition-colors"
                    >
                        <div className="flex-1 min-w-0">
                            <span className="font-semibold truncate">
                                {admin?.username}
                            </span>

                            <p className="text-sm text-gray-400 truncate">
                                {admin?.email}
                            </p>
                        </div>
                    </button>

                    <div className="mt-3 flex justify-evenly gap-2 text-sm">
                        <Button color="ERROR" onClick={() => setToken("")}>
                            Sign Out
                        </Button>
                    </div>
                </div>

                {/* navigation */}
                <nav className="px-3 py-4 space-y-6">
                    {SECTIONS.map((s) => (
                        <SidebarSection key={s.title} section={s} />
                    ))}
                </nav>
            </aside>

            {/* content */}
            <main className="mx-auto max-w-6xl">
                <Outlet />
            </main>
        </div>
    )
}

export default Layout
