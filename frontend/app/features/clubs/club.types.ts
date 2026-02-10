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