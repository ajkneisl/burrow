import type { User } from "@features/auth/user.types.ts"
import type { Profile } from "@features/profile/profile.model.ts"

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

export interface ClubMemberResponse {
    member: ClubMember
    user: User
    profile: Profile
}

export interface ClubResponse {
    club: Club
    membership: ClubMember | null
    memberCount: number
    requestedToJoin: boolean | null
}

export interface MyClubResponse {
    club: Club
    membership: ClubMember
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

export const ROLE_ORDER: Record<ClubRole, number> = {
    ADMINISTRATOR: 0,
    MODERATOR: 1,
    MEMBER: 2
}