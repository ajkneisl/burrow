import { get } from "@api/api.ts"
import type { Topic } from "@features/chat/chat.types.ts"

/**
 * Get all topics.
 *
 * @param page The page of topics.
 */
export async function getTopics(page: number): Promise<Topic[]> {
    return get(`/chat/topics`, { query: { page } })
}
