/**
 * An article.
 */
export type Article = {
    slug: string
    title: string
    description: string | null
    content: string
    published: boolean
    createdAt: number
    updatedAt: number
}

/**
 * An article being created or updated.
 */
export type SubmittedArticle = {
    slug: string
    title: string
    description: string | null
    content: string
    published: boolean
}
