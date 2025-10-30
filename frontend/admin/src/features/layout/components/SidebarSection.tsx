import type { NavSection } from "../layout.models.ts"

export function SidebarSection({ section }: { section: NavSection }) {
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
                            aria-current={
                                window.location.pathname === item.href
                                    ? "page"
                                    : undefined
                            }
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
