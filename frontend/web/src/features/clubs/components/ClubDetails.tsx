import { Card } from "@umnburrow/core"
import { Instagram, Globe, Linkedin } from "lucide-react"
import type { ClubLink } from "@features/clubs/clubs.types.ts"

type ClubDetailsProps = {
    description: string
    links: Partial<Record<ClubLink, string>>
}

const LINK_CONFIG: Record<ClubLink, {
    icon: typeof Instagram
    label: string
    toUrl: (value: string) => string
}> = {
    INSTAGRAM: {
        icon: Instagram,
        label: "Instagram",
        toUrl: (handle) => `https://instagram.com/${handle.replace(/^@/, "")}`,
    },
    X: {
        icon: ({ className }: { className?: string }) => (
            <svg viewBox="0 0 24 24" className={className} fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
        ),
        label: "X",
        toUrl: (handle) => `https://x.com/${handle.replace(/^@/, "")}`,
    },
    WEBSITE: {
        icon: Globe,
        label: "Website",
        toUrl: (url) => url,
    },
    LINKED_IN: {
        icon: Linkedin,
        label: "LinkedIn",
        toUrl: (handle) => `https://linkedin.com/in/${handle}`,
    },
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
                        const config = LINK_CONFIG[type]
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
