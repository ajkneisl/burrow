/**
 * App-wide constants and configuration.
 */

export const APP_VERSION = "0.4.0"

export const APP_NAME = "Burrow"

export const UMN_COLORS = {
    MAROON: "#7A0019",
    GOLD: "#FFCC33",
    DARK_MAROON: "#5A0013"
} as const

export const SOCIAL_LINKS = {
    GITHUB: "https://github.com/ajkneisl/burrow",
    PRIVACY: "https://umn.app/privacy",
    TERMS: "https://umn.app/terms",
    SUPPORT: "mailto:support@umn.app"
} as const

export const UMN_COORDS = {
    latitude: 44.9746,
    longitude: -93.2354,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05
} as const

export const BURROW_TYPES = {
    STUDY: "STUDY",
    EVENT: "EVENT",
    CLUB: "CLUB",
    PROJECT: "PROJECT"
} as const

export const NOTIFICATION_KINDS = {
    UPCOMING_MEETING: "UPCOMING_MEETING",
    NEW_MEETING: "NEW_MEETING",
    MEETING_MESSAGE: "MEETING_MESSAGE",
    INVITE_RECEIVED: "INVITE_RECEIVED",
    NEWSLETTER: "NEWSLETTER",
    RECOMMENDED: "RECOMMENDED"
} as const

/**
 * Pagination defaults
 */
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 20,
    DEFAULT_PAGE: 1
} as const

/**
 * Query stale times (in milliseconds)
 */
export const STALE_TIME = {
    SHORT: 1000 * 60, // 1 minute
    MEDIUM: 1000 * 60 * 5, // 5 minutes
    LONG: 1000 * 60 * 30 // 30 minutes
} as const

/**
 * Animation durations (in milliseconds)
 */
export const ANIMATION_DURATION = {
    FAST: 200,
    NORMAL: 300,
    SLOW: 500
} as const
