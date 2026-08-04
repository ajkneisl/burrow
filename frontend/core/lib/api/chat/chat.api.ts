import { get, put } from "../client"
import type { Topic } from "./chat.models"

/**
 * Get a page of topics.
 *
 * @param page The page of topics.
 */
export async function getTopics(page: number): Promise<Topic[]> {
    return get("/chat/topics", { query: { page } })
}

/**
 * Create a new topic.
 *
 * @param name The name of the topic.
 * @param description The description of the topic.
 */
export async function createTopic(
    name: string,
    description?: string
): Promise<Topic> {
    return put("/chat/topics", { name, description })
}
