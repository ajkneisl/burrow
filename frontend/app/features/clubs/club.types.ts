import { Globe, Link2, Lock } from "lucide-react-native"

export type ClubCategory = "SPORTS" | "SOCIAL" | "CREATIVE" | "EDUCATIONAL"
export type ClubPrivacy = "PUBLIC" | "UNLISTED" | "PRIVATE"
export type ClubRole = "ADMINISTRATOR" | "MODERATOR" | "MEMBER"

export interface Club {
    id: string
    ownerID: string
    name: string
    displayName: string
    description: string
    category: ClubCategory
    privacy: ClubPrivacy
    requestToJoin: boolean
    createdAt: number
}

export interface ClubMember {
    userID: string
    clubID: string
    joinedAt: number
    role: ClubRole
    roleName: string
}

export interface ClubResponse {
    club: Club
    membership: ClubMember | null
    memberCount: number
    requestedToJoin: boolean | null
}

export interface ClubMemberResponse {
    member: ClubMember
    user: { id: string; username: string }
    profile: { userID: string; name: string; classes: string[] }
}

export interface MyClubResponse {
    club: Club
    membership: ClubMember
}

export const ROLE_ORDER: Record<ClubRole, number> = {
    ADMINISTRATOR: 0,
    MODERATOR: 1,
    MEMBER: 2
}

export interface SubmittedClub {
    name: string
    displayName: string
    description: string
    category: ClubCategory
    privacy: ClubPrivacy
    requestToJoin: boolean
    members: string[]
}

export type CreateClubFormState = {
    name: string
    displayName: string
    description: string
    category: ClubCategory
    privacy: ClubPrivacy
    requestToJoin: boolean
}

export const initialFormState: CreateClubFormState = {
    name: "",
    displayName: "",
    description: "",
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
