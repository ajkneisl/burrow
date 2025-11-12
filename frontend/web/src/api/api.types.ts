export type PaginatedResponse<T> = {
    page: number
    totalPages: number
    totalResults: number
    contents: T[]
}
