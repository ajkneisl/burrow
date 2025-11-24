import type { Topic } from "@features/chat/chat-sync.types.ts"
import { get } from "@api/api.ts"

/**
 * Get all topics.
 *
 * @param page The page of topics.
 */
export async function getTopics(page: number): Promise<Topic[]> {
    return get(`/chat/topics`, { query: { page } })
}
