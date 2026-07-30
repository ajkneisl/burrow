import type { Profile, User } from "../user/user.models"
import type { ChatMessage } from "../chat/chat.models"

/**
 * The type of group meeting.
 */
export type BurrowKind = "STUDY" | "EVENT" | "CLUB" | "PROJECT"

/**
 * Visibility of the Burrow.
 */
export type BurrowVisibility = "PUBLIC" | "UNLISTED" | "PRIVATE"

/**
 * The role of a member in a meeting.
 */
export type BurrowRole = "MEMBER" | "HOST" | "MODERATOR"

/**
 * The status of a member in a meeting.
 */
export type BurrowMemberStatus = "JOINED" | "LEFT" | "WAITLISTED" | "BANNED"

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
 * A group meeting.
 *
 * @param id The unique ID of this meeting.
 * @param ownerID The owner of the group.
 * @param clubID The club that owns the meeting, if any.
 * @param title The title of the meeting.
 * @param description The description, or contents, of the meeting.
 * @param location The location of the meeting.
 * @param kind The kind of group.
 * @param beginningTime The time the meeting begins.
 * @param endTime The time the meeting ends.
 * @param tags The tags for the group.
 * @param creationDate When the meeting was created.
 * @param capacity The maximum amount of people able to be in the meeting.
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
    creationDate: number
    capacity: number
    visibility: BurrowVisibility
    requestToJoin: boolean
    reoccurring: number
}

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
 *
 * @param joined The amount of students in the meeting.
 * @param waiting The amount of students on the waitlist.
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
    joined: number
    waiting: number
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

/**
 * A project burrow submission.
 */
export type SubmittedProjectBurrow = {
    kind: "PROJECT"
    name: string
    objective: string
    className: string
    /** The IDs of the users to invite. */
    teamMembers: string[]
    /** Epoch millis. */
    dueDate: number
}

/**
 * A study, event or club burrow submission.
 */
export type SubmittedStudyEventBurrow = {
    kind: "STUDY" | "EVENT" | "CLUB"
    title: string
    description: string
    location: string
    /** Epoch millis. */
    beginningTime: number
    /** Epoch millis. */
    endTime: number
    tags: string[]
    capacity: number
    visibility: BurrowVisibility
    requestToJoin: boolean
    reoccurring: number
    clubID?: string
}

/**
 * A burrow submitted through a form.
 */
export type SubmittedBurrow = SubmittedProjectBurrow | SubmittedStudyEventBurrow

/**
 * The options for when the Burrow can reoccur.
 */
export const NOT_REOCCURRING = -1
export const DAILY = 0
export const WEEKLY = 1
export const MONTHLY = 2

/**
 * The unit a Burrow reoccurs on, like `week`.
 *
 * @param timeframe The timeframe of the Burrow.
 */
export function getReoccurUnit(timeframe: number): string {
    switch (timeframe) {
        case DAILY:
            return "day"
        case WEEKLY:
            return "week"
        case MONTHLY:
            return "month"
        default:
            return ""
    }
}

/**
 * Get a string depending on when the Burrow reoccurs.
 *
 * @param timeframe The timeframe of the Burrow.
 * @param slim If `This Burrow reoccurs` should not be included.
 */
export function getReoccurringText(timeframe: number, slim?: boolean): string {
    const unit = getReoccurUnit(timeframe)

    if (!unit) return ""

    return slim ? `every ${unit}.` : `This Burrow reoccurs every ${unit}.`
}
