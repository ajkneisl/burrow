import type { User } from "@features/auth/user.types.ts"
import type { Profile } from "@features/profile/profile.model.ts"
import { BookOpen, FolderKanban, PartyPopper, Users } from "lucide-react"
import type { ChatMessage } from "@features/chat/chat.types.ts"

/**
 * The type of group meeting.
 */
export type BurrowKind = "STUDY" | "EVENT" | "CLUB" | "PROJECT"

/**
 * The type of general location.
 */
export type LocationType =
    | "PARKING"
    | "VENDING"
    | "STUDY"
    | "RESTROOM"
    | "FOOD"
    | "OTHER"

/**
 * Base type for all locations on the map.
 */
export type Location = BurrowLocation | GeneralLocation

/**
 * A location representing a Burrow.
 */
export interface BurrowLocation {
    type: "BurrowLocation"
    burrow: Burrow
    lat: number
    lng: number
}

/**
 * A general location for specific amenities or points of interest.
 */
export interface GeneralLocation {
    type: "GeneralLocation"
    name: string
    locationType: LocationType
    lat: number
    lng: number
    description?: string
}

/**
 * An icon and label that describes burrow kinds.
 *
 * @see BurrowKind
 */
export const BURROW_KIND_CONFIG: Record<
    BurrowKind,
    {
        label: string
        icon: ForwardRefExoticComponent<
            Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
        >
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

/**
 * Visibility of the Burrow.
 */
export type BurrowVisibility = "PUBLIC" | "UNLISTED" | "PRIVATE"

/**
 * A group meeting.
 *
 * @param id The unique ID of this meeting.
 * @param owner The owner of the group.
 * @param title The title of the meeting.
 * @param description The description, or contents, of the meeting.
 * @param location The location of the meeting.
 * @param kind The kind of group.
 * @param beginningTime The time the meeting begins.
 * @param endTime The time the meeting ends.
 * @param tags The tags for the group.
 * @param capacity The maximum amount of people able to be in the meeting.
 * @param joined The amount of students in the meeting.
 * @param waiting The amount of students on the waitlist.
 */
export interface Burrow {
    id: string
    ownerID: string
    clubID?: string | null
    title: string
    description: string
    location: string
    kind: BurrowKind
    beginningTime: number
    endTime: number
    tags: string[]
    capacity: number
    visibility: BurrowVisibility
    requestToJoin: boolean
    reoccurring: number
    joined: number
    waiting: number
}

/**
 * The options for when the Burrow can reoccur.
 */
export const NOT_REOCCURRING = -1
export const DAILY = 0
export const WEEKLY = 1
export const MONTHLY = 2

/**
 * Get a string depending on when the Burrow reoccurs.
 *
 * @param timeframe The timeframe of the Burrow.
 * @param slim If `This Burrow reoccurs` should not be included
 */
export function getReoccurringText(timeframe: number, slim?: boolean): string {
    let word = ""

    switch (timeframe) {
        case DAILY:
            word = "day"
            break
        case WEEKLY:
            word = "week"
            break
        case MONTHLY:
            word = "month"
            break
        default:
            return ""
    }

    return slim ? `every ${word}.` : `This Burrow reoccurs every ${word}.`
}

/**
 * The role of a member in a meeting.
 */
export type BurrowRole = "MEMBER" | "HOST" | "MODERATOR"

/**
 * The role of a member in a meeting.
 */
export type BurrowMemberStatus = "JOINED" | "LEFT" | "WAITLISTED" | "BANNED"

/**
 * The relationship between a user and a meeting.
 */
export interface BurrowMembership {
    burrowID: string
    userID: string
    role: BurrowRole
    status: BurrowMemberStatus
    joinedAt: number
    leftAt: number | null
}

/**
 * A response to retrieving a membership.
 */
export interface BurrowMembershipResponse {
    membership: BurrowMembership
    user: User
    profile: Profile
}

/**
 * Information on a meeting and the membership between the user and the meeting.
 */
export interface BurrowResponse {
    burrow: Burrow
    burrowAuthor?: string
    burrowAuthorProfile?: Profile
    membership?: BurrowMembership
    requestedToJoin: boolean
    bookmarked: boolean
    highlightedTags: number[]
    hostedByTa?: boolean
    clubName?: string | null
    clubDisplayName?: string | null
}

/**
 * Information on a Burrow that's in your schedule.
 */
export interface ScheduleBurrowResponse {
    burrow: Burrow
    burrowAuthor: string
    membership: BurrowMembershipResponse
    isPinned: boolean
    latestChatMessage?: ChatMessage
}

/**
 * The status of a join request.
 */
export type JoinRequestStatus = "PENDING" | "APPROVED" | "REJECTED"

/**
 * A request from a user to join a burrow.
 */
export interface JoinRequest {
    burrowID: string
    requesterID: string
    status: JoinRequestStatus
    createdAt: number
    reviewedAt: number | null
    reviewedBy: string | null
}

/**
 * A join request with user information.
 */
export interface JoinRequestWithUser {
    request: JoinRequest
    requester: string
    requesterProfile: Profile
}

/**
 * The status of an invite.
 */
export type InviteStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED"

/**
 * An invitation for a user to join a burrow.
 */
export interface Invite {
    burrowID: string
    inviterID: string
    inviteeID: string
    status: InviteStatus
    createdAt: number
    respondedAt: number | null
    expiresAt: number | null
}

/**
 * An invite with user information.
 */
export interface InviteWithUsers {
    invite: Invite
    inviterUsername: string
    inviterProfile: Profile | null
    inviteeUsername: string
    inviteeProfile: Profile | null
}
