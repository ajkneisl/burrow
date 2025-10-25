import { Outlet } from "react-router"
type NavItem = {
    label: string
    href?: string
    color?: string // tailwind color utility like 'bg-primary' | 'bg-secondary' | 'bg-gray-500'
    current?: boolean
}

type NavSection = {
    title: string
    items: NavItem[]
}

function SidebarSection({ section }: { section: NavSection }) {
    return (
        <div>
            <div className="px-2 mb-2 text-[11px] uppercase tracking-[0.08em] text-gray-400">
                {section.title}
            </div>
            <ul className="space-y-1">
                {section.items.map((item) => (
                    <li key={item.label}>
                        <a
                            href={item.href ?? "#"}
                            aria-current={item.current ? "page" : undefined}
                            className={[
                                "group flex items-center gap-3 rounded-lg px-3 py-2",
                                "hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                "aria-[current=page]:bg-primary/15 aria-[current=page]:ring-1 aria-[current=page]:ring-primary/30"
                            ].join(" ")}
                        >
                            <span
                                className={[
                                    "size-2 rounded-full",
                                    item.color ?? "bg-gray-500"
                                ].join(" ")}
                            />
                            <span className="truncate">{item.label}</span>
                            <span className="ml-auto h-4 w-0 rounded-full bg-primary transition-all duration-200 group-aria-[current=page]:w-1.5" />
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    )
}

function Admin() {
    const SECTIONS: NavSection[] = [
        {
            title: "Overview",
            items: [
                {
                    label: "Dashboard",
                    href: "/",
                    color: "bg-primary",
                    current: true
                },
                {
                    label: "Analytics",
                    href: "/analytics",
                    color: "bg-secondary"
                }
            ]
        },
        {
            title: "Notifications",
            items: [
                { label: "Create Notification", href: "#", color: "bg-red-500" }
            ]
        },
        {
            title: "Groups",
            items: [{ label: "All Groups", href: "#", color: "bg-emerald-500" }]
        },
        {
            title: "Users",
            items: [{ label: "All Users", href: "#", color: "bg-amber-600" }]
        },
        {
            title: "Reports",
            items: [{ label: "All Reports", href: "#", color: "bg-primary" }]
        }
    ]

    return (
        <div className="min-h-screen w-full flex bg-background text-text transition-colors duration-300">
            {/* Sidebar */}
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
                            <div className="flex items-center justify-between">
                                <span className="font-semibold truncate">
                                    AJ Kneisl
                                </span>
                                <span className="text-xs text-gray-400">
                                    Administrator
                                </span>
                            </div>

                            <p className="text-sm text-gray-400 truncate">
                                kneis033@umn.edu
                            </p>
                        </div>
                    </button>
                    <div className="mt-3 flex justify-evenly gap-2 text-sm">
                        <a
                            href="#"
                            className="rounded-lg px-3 py-2 text-center hover:bg-primary/10"
                        >
                            Settings
                        </a>
                        <a
                            href="#"
                            className="rounded-lg px-3 py-2 text-center hover:bg-primary/10"
                        >
                            Sign out
                        </a>
                    </div>
                </div>

                {/* Nav sections */}
                <nav className="px-3 py-4 space-y-6">
                    {SECTIONS.map((s) => (
                        <SidebarSection key={s.title} section={s} />
                    ))}
                </nav>
            </aside>

            {/* Main content */}
            <main className="mx-auto max-w-6xl">
                <Outlet />
            </main>
        </div>
    )
}

export default Admin
