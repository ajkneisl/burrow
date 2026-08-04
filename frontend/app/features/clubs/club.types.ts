import type { ClubCategory, ClubLink, ClubPrivacy, ClubRole } from "@umnburrow/core/api"
import {
    Crown,
    Globe,
    Instagram,
    Link2,
    Linkedin,
    Lock,
    Shield,
    UserRound
} from "lucide-react-native"

/**
 * How clubs are presented on mobile, plus the create-club form state. The club
 * models themselves live in `@umnburrow/core/api`.
 */

export type CreateClubFormState = {
    name: string
    displayName: string
    description: string
    links: Partial<Record<ClubLink, string>>
    category: ClubCategory
    privacy: ClubPrivacy
    requestToJoin: boolean
}

export const initialFormState: CreateClubFormState = {
    name: "",
    displayName: "",
    description: "",
    links: {},
    category: "SOCIAL",
    privacy: "PUBLIC",
    requestToJoin: false
}

export const CLUB_CATEGORIES: { value: ClubCategory; label: string }[] = [
    { value: "SPORTS", label: "Sports" },
    { value: "SOCIAL", label: "Social" },
    { value: "CREATIVE", label: "Creative" },
    { value: "EDUCATIONAL", label: "Educational" }
]

export function roleBadgeConfig(role: ClubRole) {
    switch (role) {
        case "ADMINISTRATOR":
            return {
                bg: "bg-yellow-500/15",
                text: "text-yellow-600",
                Icon: Crown
            }
        case "MODERATOR":
            return {
                bg: "bg-indigo-500/15",
                text: "text-indigo-600",
                Icon: Shield
            }
        default:
            return {
                bg: "bg-gray-500/15",
                text: "text-gray-600",
                Icon: UserRound
            }
    }
}

export const CLUB_PRIVACY_OPTIONS: {
    value: ClubPrivacy
    label: string
    description: string
    icon: typeof Globe
}[] = [
    {
        value: "PUBLIC",
        label: "Public",
        description: "Visible to everyone on Burrow",
        icon: Globe
    },
    {
        value: "UNLISTED",
        label: "Unlisted",
        description: "Only accessible via link",
        icon: Link2
    },
    {
        value: "PRIVATE",
        label: "Private",
        description: "Invite-only, not searchable",
        icon: Lock
    }
]

export type ClubStepProps = {
    updateField: <K extends keyof CreateClubFormState>(
        field: K,
        value: CreateClubFormState[K]
    ) => void
    formState: CreateClubFormState
    errors: Record<string, string>
}

export const LINK_CONFIG: Record<
    ClubLink,
    {
        icon: typeof Instagram
        label: string
        toUrl: (value: string) => string
    }
> = {
    INSTAGRAM: {
        icon: Instagram,
        label: "Instagram",
        toUrl: (handle) => `https://instagram.com/${handle.replace(/^@/, "")}`
    },
    X: {
        icon: Globe,
        label: "X",
        toUrl: (handle) => `https://x.com/${handle.replace(/^@/, "")}`
    },
    WEBSITE: {
        icon: Globe,
        label: "Website",
        toUrl: (url) => url
    },
    LINKED_IN: {
        icon: Linkedin,
        label: "LinkedIn",
        toUrl: (handle) => `https://linkedin.com/in/${handle}`
    }
}
