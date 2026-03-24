export function formatInstagramUrl(instagram: string): string {
    const username = instagram
        .replace(/^@/, "")
        .replace(/.*instagram\.com\//, "")
    return `https://instagram.com/${username}`
}

export function formatLinkedInUrl(linkedIn: string): string {
    if (linkedIn.startsWith("http")) {
        return linkedIn
    }
    if (linkedIn.startsWith("linkedin.com")) {
        return `https://${linkedIn}`
    }
    return `https://linkedin.com/in/${linkedIn}`
}
