import type { User } from "@features/auth/user.types.ts"
import type { Profile } from "@features/profile/profile.model.ts"
import type { ChatMessage } from "@features/chat/chat.types.ts"
import {
    BookOpen,
    FolderKanban,
    PartyPopper,
    Users,
    type LucideIcon
} from "lucide-react-native"

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
 * An icon and label that describes Burrow kinds.
 *
 * @see BurrowKind
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
 */
export interface Burrow {
    id: string
    ownerID: string
    clubID?: string
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
    className?: string // Optional: for PROJECT type burrows
}

export const NOT_REOCCURRING = -1
export const DAILY = 0
export const WEEKLY = 1
export const MONTHLY = 2

export function getReoccurringText(timeframe: number, slim?: boolean): string {
    let text = ""

    switch (timeframe) {
        case DAILY:
            text = "daily"
            break
        case WEEKLY:
            text = "weekly"
            break
        case MONTHLY:
            text = "monthly"
            break
        default:
            return ""
    }

    return slim ? text : `Reoccurs ${text}`
}

export function getReoccurText(timeframe: number): string {
    switch (timeframe) {
        case DAILY:
            return "daily"
        case WEEKLY:
            return "week"
        case MONTHLY:
            return "month"
        default:
            return ""
    }
}

/**
 * The role of a member ina  meeting.
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
    clubName?: string
    clubDisplayName?: string
    joined: number
    waiting: number
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
