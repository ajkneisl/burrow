import {
    type Burrow,
    BURROW_KIND_CONFIG
} from "@features/burrows/burrows.types.tsx"
import { useNavigate } from "react-router"
import { formatDateTime } from "@api/util.ts"
import clsx from "clsx"
import { Badge, Chip } from "@umnburrow/core"
import { MapPin } from "lucide-react"

/**
 * {@link SearchPreview}
 */
type PreviewProps = {
    burrow: Burrow
    onClick: () => void
}

/**
 * A preview of a search entry.
 *
 * @param burrow The Burrow to preview.
 * @param onClick When the Burrow is clicked (close search thing)
 *
 * @author AJ Kneisl
 */
export default function SearchPreview({ burrow, onClick }: PreviewProps) {
    const nav = useNavigate()

    return (
        <button
            type="button"
            onClick={() => {
                nav(`/burrow/${burrow.id}`)
                onClick()
            }}
            className={clsx(
                "flex w-full flex-row items-center justify-between px-3 py-2 text-left",
                "cursor-pointer bg-hero/20 text-text transition-all hover:bg-hero/40"
            )}
        >
            <div className="flex flex-col">
                <div className="text-sm font-medium text-text">
                    {burrow.title}
                </div>

                <div className="mt-2 flex flex-row flex-wrap gap-2">
                    <div className="flex flex-row flex-wrap items-center gap-1.5 pt-1">
                        {/* burrow type */}
                        <Chip
                            size="md"
                            color={BURROW_KIND_CONFIG[burrow.kind]?.className}
                            icon={BURROW_KIND_CONFIG[burrow.kind]?.icon}
                        >
                            {BURROW_KIND_CONFIG[burrow.kind]?.label}
                        </Chip>
                    </div>

                    {burrow.tags.slice(0, 2).map((tag: string) => (
                        <Badge size="medium" key={tag}>
                            {tag}
                        </Badge>
                    ))}
                </div>
            </div>

            <div>
                <div className=" flex items-center justify-end gap-1 text-xs text-text/80">
                    {/* location pin icon */}
                    <MapPin className="size-4 shrink-0" />
                    <p className="truncate">
                        {burrow.location
                            ?.split(" ")[0]
                            ?.charAt(0)
                            .toUpperCase() +
                            burrow.location
                                ?.split(" ")[0]
                                ?.slice(1)
                                .toLowerCase()}
                    </p>
                </div>

                <time
                    className="text-xs text-text/60"
                    aria-label="Time Occurring"
                >
                    {formatDateTime(burrow.beginningTime, burrow.endTime)}
                </time>
            </div>
        </button>
    )
}
