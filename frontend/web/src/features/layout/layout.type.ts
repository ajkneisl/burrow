export interface MetaTagsState {
    title?: string
    description?: string
    image?: string
    url?: string
}

export const defaultMetaTags: MetaTagsState = {
    title: "Burrow — Study Together @ UMN",
    description:
        "Host and discover your next study group. Learn better with Burrow.",
    image: "https://umn.app/image/burrow.png",
    url: "https://umn.app"
}