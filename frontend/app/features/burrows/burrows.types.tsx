import type { BurrowKind } from "@umnburrow/core/api"
import {
    BookOpen,
    FolderKanban,
    PartyPopper,
    Users,
    type LucideIcon
} from "lucide-react-native"

/**
 * How each {@link BurrowKind} is presented on mobile. The Burrow models
 * themselves live in `@umnburrow/core/api`.
 */
export const BURROW_KIND_CONFIG: Record<
    BurrowKind,
    {
        label: string
        Icon: LucideIcon
        colorKey: "success" | "secondary" | "info" | "error"
    }
> = {
    STUDY: {
        label: "Study",
        Icon: BookOpen,
        colorKey: "success"
    },
    EVENT: {
        label: "Event",
        Icon: PartyPopper,
        colorKey: "secondary"
    },
    CLUB: {
        label: "Club",
        Icon: Users,
        colorKey: "info"
    },
    PROJECT: {
        label: "Project",
        Icon: FolderKanban,
        colorKey: "error"
    }
}
