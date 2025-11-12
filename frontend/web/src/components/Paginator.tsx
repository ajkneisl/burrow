import { Button } from "@umnburrow/core"

/**
 * Props for {@link Paginator}
 */
type PaginatorProps = {
    currentPage: number
    totalPages: number
    totalResults: number
    onPageChange: (page: number) => void
    isLoading?: boolean
}

/**
 * A reusable pagination component with Previous/Next navigation.
 *
 * @param currentPage The current page number (1-indexed)
 * @param totalPages The total number of pages
 * @param totalResults The total number of results across all pages
 * @param onPageChange Callback when page changes
 * @param isLoading Whether data is currently being fetched
 */
export default function Paginator({
    currentPage,
    totalPages,
    totalResults,
    onPageChange,
    isLoading = false
}: PaginatorProps) {
    if (totalPages <= 1) {
        return null
    }

    return (
        <div className="mt-8 flex items-center justify-between rounded-2xl border border-card-border bg-card p-4 shadow-sm">
            <div className="text-sm text-text/60">
                Page {currentPage} of {totalPages}{" "}
                <span className="text-text/40">
                    ({totalResults} total results)
                </span>
            </div>

            <div className="flex gap-2">
                <Button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                    aria-label="Previous page"
                >
                    ← Previous
                </Button>
                <Button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || isLoading}
                    aria-label="Next page"
                >
                    Next →
                </Button>
            </div>
        </div>
    )
}
