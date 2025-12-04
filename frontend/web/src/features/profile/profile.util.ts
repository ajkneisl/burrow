import type { DiscoverReasoning } from "@features/auth/user.types.ts"

/**
 * Get ar readable label for a {@link DiscoverReasoning}.
 */
export function getReasoningLabel(reasoning: DiscoverReasoning): string {
    switch (reasoning) {
        case "SHARED_BURROW":
            return "Shares some Burrows"
        case "FRIEND_FOLLOWS":
            return "Followed by friends"
        case "THEY_FOLLOW":
            return "Follows you"
        case "SHARED_FRIEND":
            return "Friend of friends"
        default:
            return ""
    }
}
