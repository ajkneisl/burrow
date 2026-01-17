import { get, put } from "@api/api"
import type { Topic } from "@features/chat/chat.types"

/**
 * Get all topics.
 *
 * @param page The page of topics.
 */
export async function getTopics(page: number): Promise<Topic[]> {
    return get(`/chat/topics`, { query: { page } })
}

/**
 * Create a new topic.
 *
 * @param name The name of the topic.
 * @param description The description of the topic (optional).
 */
export async function createTopic(
    name: string,
    description?: string
): Promise<Topic> {
    return put(`/chat/topics`, { name, description })
}
