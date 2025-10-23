import type { User } from "@features/auth/api/user.types.ts"

/**
 * The type of group meeting.
 */
export type GroupType = "CLUB" | "STUDY"

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
export interface GroupMeeting {
    id: string
    owner: string
    title: string
    description: string
    location: string
    kind: GroupType
    beginningTime: number
    endTime: number
    tags: string[]
    capacity: number
    joined: number
    waiting: number
}

/**
 * A group meeting created by a form.
 */
export type SubmittedGroupMeeting = {
    title: string
    description: string
    location: string
    kind: GroupType
    beginningTime: number // epoch millis
    endTime: number // epoch millis
    tags: string[] // JSON-friendly; backend can convert to Set<String>
    capacity: number
}

/**
 * The role of a member ina  meeting.
 */
export type MeetingRole = "MEMBER" | "HOST" | "MODERATOR"

/**
 * The role of a member in a meeting.
 */
export type MeetingMemberStatus = "JOINED" | "LEFT" | "WAITLISTED" | "BANNED"

/**
 * The relationship between a user and a meeting.
 */
export interface MeetingMembership {
    meetingId: string
    userId: string
    role: MeetingRole
    status: MeetingMemberStatus
    joinedAt: number
    leftAt: number | null
}

/**
 * A response to retrieving a membership.
 */
export interface MeetingMembershipResponse {
    membership: MeetingMembership
    user: User
}

/**
 * Information on a meeting and the membership between the user and the meeting.
 */
export interface GroupMeetingResponse {
    meeting: GroupMeeting
    meetingAuthor?: string
    membership?: MeetingMembership
    bookmarked: boolean
}
