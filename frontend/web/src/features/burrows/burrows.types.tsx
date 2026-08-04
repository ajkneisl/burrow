import type { BurrowKind } from "@umnburrow/core/api"
import { BookOpen, FolderKanban, PartyPopper, Users } from "lucide-react"
import type { ComponentType, SVGProps } from "react"

/**
 * How each {@link BurrowKind} is presented on the web. The Burrow models
 * themselves live in `@umnburrow/core/api`.
 */
export const BURROW_KIND_CONFIG: Record<
    BurrowKind,
    {
        label: string
        icon: ComponentType<SVGProps<SVGSVGElement>>
        className: "success" | "secondary" | "info" | "error"
    }
> = {
    STUDY: {
        label: "Study",
        icon: BookOpen,
        className: "success"
    },
    EVENT: {
        label: "Event",
        icon: PartyPopper,
        className: "secondary"
    },
    CLUB: {
        label: "Club",
        icon: Users,
        className: "info"
    },
    PROJECT: {
        label: "Project",
        icon: FolderKanban,
        className: "error"
    }
}
