import { useNavigate } from "react-router"
import clsx from "clsx"
import ClubProfilePicture from "@features/clubs/components/ClubProfilePicture.tsx"

type ClubPreviewProps = {
    clubID: string
    displayName: string
    name: string
    onClick: () => void
}

export default function ClubSearchPreview({
    clubID,
    displayName,
    name,
    onClick
}: ClubPreviewProps) {
    const nav = useNavigate()

    return (
        <button
            type="button"
            onClick={() => {
                nav(`/club/${name}`)
                onClick()
            }}
            className={clsx(
                "flex w-full cursor-pointer flex-row items-center gap-3 px-3 py-2 text-left",
                "bg-hero/20 text-text hover:bg-hero/40 transition-all"
            )}
        >
            <ClubProfilePicture
                clubID={clubID}
                displayName={displayName}
                clubName={name}
                size="sm"
            />

            <div className="flex min-w-0 flex-col">
                <div className="text-text truncate text-sm font-medium">
                    {displayName}
                </div>

                <div className="text-text/60 truncate text-xs">
                    @{name}
                </div>
            </div>
        </button>
    )
}