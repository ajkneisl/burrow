import { Input } from "@umnburrow/core"
import { Plus, X } from "lucide-react"
import type { ClubLink } from "@features/clubs/clubs.types.tsx"
import { CLUB_LINK_CONFIG } from "@features/clubs/clubs.types.tsx"
import Field from "@features/burrows/create/components/Field.tsx"

const LINK_OPTIONS = (Object.keys(CLUB_LINK_CONFIG) as ClubLink[]).map((key) => ({
    key,
    ...CLUB_LINK_CONFIG[key],
}))

type ClubLinksEditorProps = {
    links: Partial<Record<ClubLink, string>>
    onChange: (links: Partial<Record<ClubLink, string>>) => void
}

export default function ClubLinksEditor({ links, onChange }: ClubLinksEditorProps) {
    const activeKeys = Object.keys(links) as ClubLink[]
    const available = LINK_OPTIONS.filter((o) => !activeKeys.includes(o.key))

    function updateLink(key: ClubLink, value: string) {
        onChange({ ...links, [key]: value })
    }

    function removeLink(key: ClubLink) {
        const next = { ...links }
        delete next[key]
        onChange(next)
    }

    function addLink(key: ClubLink) {
        onChange({ ...links, [key]: "" })
    }

    return (
        <div className="space-y-3">
            {activeKeys.map((key) => {
                const config = CLUB_LINK_CONFIG[key]
                if (!config) return null
                const Icon = config.icon

                return (
                    <div key={key} className="flex items-end gap-2">
                        <Field label={config.label} className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <Icon className="text-text/40 h-4 w-4 shrink-0" />
                                <Input
                                    value={links[key] ?? ""}
                                    onChange={(e) => updateLink(key, e.target.value)}
                                    placeholder={config.placeholder}
                                />
                            </div>
                        </Field>
                        <button
                            type="button"
                            onClick={() => removeLink(key)}
                            className="text-text/40 hover:bg-error/20 hover:text-error mb-1 rounded-md p-2 transition-colors"
                            aria-label={`Remove ${config.label}`}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )
            })}

            {available.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {available.map((option) => {
                        const Icon = option.icon
                        return (
                            <button
                                key={option.key}
                                type="button"
                                onClick={() => addLink(option.key)}
                                className="border-border bg-hero/20 hover:bg-hero/50 text-text/60 hover:text-text flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
                            >
                                <Plus className="h-3 w-3" />
                                <Icon className="h-3.5 w-3.5" />
                                {option.label}
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
