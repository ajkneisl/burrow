import type { ClubRole } from "@features/clubs/club.types"
import { useThemeColors } from "@api/theme/useThemeColors"
import { Crown, Shield, UserRound } from "lucide-react-native"
import { Text, View } from "react-native"

type ClubRoleBadgeProps = { role: ClubRole; roleName?: string }

export default function ClubRoleBadge({ role, roleName }: ClubRoleBadgeProps) {
    const colors = useThemeColors()

    const config = {
        ADMINISTRATOR: {
            icon: Crown,
            bg: "#FEF3C7",
            text: "#92400E",
            label: "Administrator"
        },
        MODERATOR: {
            icon: Shield,
            bg: "#E0E7FF",
            text: "#3730A3",
            label: "Moderator"
        },
        MEMBER: {
            icon: UserRound,
            bg: colors.card,
            text: colors.text,
            label: "Member"
        }
    }

    const c = config[role]
    const Icon = c.icon
    const label = roleName || c.label

    return (
        <View
            className="flex-row items-center gap-1 rounded-full px-2.5 py-1"
            style={{ backgroundColor: c.bg }}
        >
            <Icon size={12} color={c.text} />
            <Text style={{ color: c.text, fontSize: 11, fontWeight: "600" }}>
                {label}
            </Text>
        </View>
    )
}
