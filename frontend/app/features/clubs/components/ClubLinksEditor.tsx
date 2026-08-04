import type { ClubLink } from "@umnburrow/core/api"
import { View, Pressable } from "react-native"
import { Instagram, Globe, Linkedin, Plus, X } from "lucide-react-native"

import { Input, Text } from "@components/core"
import { useThemeColors } from "@api/theme/useThemeColors"
import ThemedIcon from "@components/core/ThemedIcon"

const LINK_OPTIONS: { key: ClubLink; label: string; icon: typeof Instagram; placeholder: string }[] = [
    { key: "INSTAGRAM", label: "Instagram", icon: Instagram, placeholder: "@handle" },
    { key: "X", label: "X", icon: X, placeholder: "@handle" },
    { key: "WEBSITE", label: "Website", icon: Globe, placeholder: "https://example.com" },
    { key: "LINKED_IN", label: "LinkedIn", icon: Linkedin, placeholder: "profile-slug" },
]

type ClubLinksEditorProps = {
    links: Partial<Record<ClubLink, string>>
    onChange: (links: Partial<Record<ClubLink, string>>) => void
}

/**
 * Editor for adding/removing/editing club social links.
 *
 * @author AJ Kneisl
 */
export default function ClubLinksEditor({ links, onChange }: ClubLinksEditorProps) {
    const colors = useThemeColors()
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
        <View className="gap-3">
            {activeKeys.map((key) => {
                const config = LINK_OPTIONS.find((o) => o.key === key)
                if (!config) return null
                const Icon = config.icon

                return (
                    <View key={key} className="flex-row items-center gap-2">
                        <Icon size={16} color={colors.text} style={{ opacity: 0.4 }} />
                        <View className="flex-1">
                            <Input
                                value={links[key] ?? ""}
                                onChangeText={(value) => updateLink(key, value)}
                                placeholder={config.placeholder}
                                autoCapitalize="none"
                            />
                        </View>
                        <Pressable
                            onPress={() => removeLink(key)}
                            className="p-2 rounded-md"
                            hitSlop={8}
                        >
                            <ThemedIcon icon={X} size={16} style={{ opacity: 0.4 }} />
                        </Pressable>
                    </View>
                )
            })}

            {available.length > 0 && (
                <View className="flex-row flex-wrap gap-2">
                    {available.map((option) => {
                        const Icon = option.icon
                        return (
                            <Pressable
                                key={option.key}
                                onPress={() => addLink(option.key)}
                                className="flex-row items-center gap-1.5 rounded-full border border-card-border bg-card px-3 py-1.5"
                            >
                                <Plus size={12} color={colors.text} style={{ opacity: 0.6 }} />
                                <Icon size={14} color={colors.text} style={{ opacity: 0.6 }} />
                                <Text className="text-text opacity-60 text-xs font-medium">
                                    {option.label}
                                </Text>
                            </Pressable>
                        )
                    })}
                </View>
            )}
        </View>
    )
}
