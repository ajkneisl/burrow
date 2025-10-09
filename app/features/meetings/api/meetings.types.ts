export interface GroupMeetingResponse {
    meeting: GroupMeeting
    meetingAuthor?: string | null
    membership?: Membership | null
    bookmarked: boolean
}

export interface Membership {
    meetingId: string
    userId: string
    role: string
    status: string
    joinedAt: number
    leftAt?: number | null
}

export interface GroupMeeting {
    id: string
    owner: string
    title: string
    description: string
    location: string
    kind: string
    beginningTime: number
    endTime: number
    tags: string[]
    creationDate: number
    capacity: number
    joined: number
    waiting: number
}