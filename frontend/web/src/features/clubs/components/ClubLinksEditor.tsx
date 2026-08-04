import type { ClubLink } from "@umnburrow/core/api"
import { Input } from "@umnburrow/core"
import { Plus, X } from "lucide-react"
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
                                <Icon className="size-4 shrink-0 text-text/40" />
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
                            className="mb-1 rounded-md p-2 text-text/40 transition-colors hover:bg-error/20 hover:text-error"
                            aria-label={`Remove ${config.label}`}
                        >
                            <X className="size-4" />
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
                                className="border-border flex items-center gap-1.5 rounded-full border bg-hero/20 px-3 py-1.5 text-xs font-medium text-text/60 transition-colors hover:bg-hero/50 hover:text-text"
                            >
                                <Plus className="size-3" />
                                <Icon className="size-3.5" />
                                {option.label}
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
