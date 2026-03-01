import { Card } from "@umnburrow/core"
import type { ClubLink } from "@features/clubs/clubs.types.tsx"
import { CLUB_LINK_CONFIG } from "@features/clubs/clubs.types.tsx"

type ClubDetailsProps = {
    description: string
    links: Partial<Record<ClubLink, string>>
}

export default function ClubDetails({ description, links }: ClubDetailsProps) {
    const linkEntries = Object.entries(links) as [ClubLink, string][]

    return (
        <Card title="About">
            <p className="text-text/80 whitespace-pre-wrap">
                {description || "No description provided."}
            </p>

            {linkEntries.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                    {linkEntries.map(([type, value]) => {
                        const config = CLUB_LINK_CONFIG[type]
                        if (!config) return null

                        const Icon = config.icon

                        return (
                            <a
                                key={type}
                                href={config.toUrl(value)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="border-border bg-hero/30 hover:bg-hero/60 text-text/70 hover:text-text flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {config.label}
                            </a>
                        )
                    })}
                </div>
            )}
        </Card>
    )
}
