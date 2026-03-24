import {
    type Club,
    type MyClubResponse,
    type ClubRole
} from "@features/clubs/club.types"
import { Pressable, View } from "react-native"
import { Chip, Text } from "@components/core"
import ClubProfilePicture from "./ClubProfilePicture"
import { Crown, Shield, UserRound } from "lucide-react-native"
import type { LucideIcon } from "lucide-react-native"

type ClubCardProps = {
    onPress: () => void
} & (
    | { variant?: "member"; item: MyClubResponse }
    | { variant: "discover"; club: Club; isMember?: boolean }
)

const ROLE_CHIP: Record<
    ClubRole,
    { color: "warn" | "info" | "secondary"; icon: LucideIcon }
> = {
    ADMINISTRATOR: { color: "warn", icon: Crown },
    MODERATOR: { color: "info", icon: Shield },
    MEMBER: { color: "secondary", icon: UserRound }
}

export default function ClubCard(props: ClubCardProps) {
    const isDiscover = props.variant === "discover"
    const club = isDiscover ? props.club : props.item.club

    return (
        <Pressable
            onPress={props.onPress}
            className="bg-card rounded-2xl border border-card-border p-4 flex-row items-center gap-3 active:opacity-80"
        >
            <ClubProfilePicture
                clubID={club.id}
                displayName={club.displayName}
                size="md"
            />

            <View className="flex-1 min-w-0">
                <View className="flex-row items-center gap-2">
                    <Text
                        className="text-text font-semibold text-base"
                        numberOfLines={1}
                    >
                        {club.displayName}
                    </Text>

                    {isDiscover && props.isMember && (
                        <Chip size="sm" color="primary" label="Joined" />
                    )}
                </View>

                {isDiscover ? (
                    <Text className="text-text opacity-50 text-xs">
                        {club.category.charAt(0) +
                            club.category.slice(1).toLowerCase()}
                    </Text>
                ) : (
                    <Text className="text-text opacity-40 text-xs">
                        /club/{club.name}
                    </Text>
                )}

                {club.description ? (
                    <Text
                        className="text-text opacity-60 text-sm mt-1"
                        numberOfLines={isDiscover ? 2 : 1}
                    >
                        {club.description}
                    </Text>
                ) : null}
            </View>

            {!isDiscover && (
                <Chip
                    size="md"
                    color={ROLE_CHIP[props.item.membership.role].color}
                    icon={ROLE_CHIP[props.item.membership.role].icon}
                    label={
                        props.item.membership.roleName ||
                        props.item.membership.role
                    }
                />
            )}
        </Pressable>
    )
}
