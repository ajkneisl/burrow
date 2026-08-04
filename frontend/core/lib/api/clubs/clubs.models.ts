import type { Profile, User } from "../user/user.models"

/**
 * The user-selected category of a club.
 */
export type ClubCategory = "SPORTS" | "SOCIAL" | "CREATIVE" | "EDUCATIONAL"

/**
 * Who a club is visible to.
 */
export type ClubPrivacy = "PUBLIC" | "UNLISTED" | "PRIVATE"

/**
 * A link that a club may have.
 */
export type ClubLink = "INSTAGRAM" | "X" | "WEBSITE" | "LINKED_IN"

/**
 * A user's role within a club.
 */
export type ClubRole = "ADMINISTRATOR" | "MODERATOR" | "MEMBER"

/**
 * A club.
 */
export interface Club {
    id: string
    ownerID: string
    name: string
    displayName: string
    description: string
    links: Partial<Record<ClubLink, string>>
    category: ClubCategory
    privacy: ClubPrivacy
    requestToJoin: boolean
    createdAt: number
}

/**
 * A user's membership within a club.
 */
export interface ClubMember {
    userID: string
    clubID: string
    joinedAt: number
    role: ClubRole
    roleName: string
}

/**
 * A club member alongside the user they belong to.
 */
export interface ClubMemberResponse {
    member: ClubMember
    user: User
    profile: Profile
}

/**
 * A response to requesting a club.
 */
export interface ClubResponse {
    club: Club
    membership: ClubMember | null
    memberCount: number
    requestedToJoin: boolean | null
}

/**
 * A club the requesting user is a member of.
 */
export interface MyClubResponse {
    club: Club
    membership: ClubMember
}

/**
 * A club submitted through a form.
 */
export interface SubmittedClub {
    name: string
    displayName: string
    description: string
    links: Partial<Record<ClubLink, string>>
    category: ClubCategory
    privacy: ClubPrivacy
    requestToJoin: boolean
    members: string[]
}

/**
 * The order roles should be displayed in, most privileged first.
 */
export const ROLE_ORDER: Record<ClubRole, number> = {
    ADMINISTRATOR: 0,
    MODERATOR: 1,
    MEMBER: 2
}

/**
 * Turn a club link handle into the URL it points at.
 *
 * @param link The kind of link.
 * @param value The stored handle or URL.
 */
export function clubLinkToUrl(link: ClubLink, value: string): string {
    const handle = value.replace(/^@/, "")

    switch (link) {
        case "INSTAGRAM":
            return `https://instagram.com/${handle}`
        case "X":
            return `https://x.com/${handle}`
        case "LINKED_IN":
            return `https://linkedin.com/in/${handle}`
        case "WEBSITE":
            return value
    }
}
