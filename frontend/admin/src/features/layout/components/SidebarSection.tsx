import { NavLink } from "react-router"
import type { NavSection } from "../layout.models.ts"

export function SidebarSection({ section }: { section: NavSection }) {
    return (
        <div>
            <div className="px-2 mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {section.title}
            </div>
            <ul className="space-y-1">
                {section.items.map((item) => (
                    <li key={item.label}>
                        <NavLink
                            to={item.href ?? "#"}
                            className={({ isActive }) =>
                                [
                                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                                    "hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                    isActive
                                        ? "bg-primary/15 ring-1 ring-primary/30 font-medium"
                                        : ""
                                ].join(" ")
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <span
                                        className={[
                                            "size-2 rounded-full transition-all",
                                            item.color ?? "bg-gray-500",
                                            isActive ? "scale-125" : ""
                                        ].join(" ")}
                                    />
                                    <span className="truncate flex-1">
                                        {item.label}
                                    </span>
                                    <span
                                        className={[
                                            "h-4 rounded-full bg-primary transition-all duration-200",
                                            isActive ? "w-1.5" : "w-0"
                                        ].join(" ")}
                                    />
                                </>
                            )}
                        </NavLink>
                    </li>
                ))}
            </ul>
        </div>
    )
}
