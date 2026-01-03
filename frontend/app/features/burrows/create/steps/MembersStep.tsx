import { View, Text, ScrollView } from "react-native"
import { UserPicker } from "@components/core"
import type { CreateStepProps } from "../create.types"

export function MembersStep({
    errors,
    formState,
    updateField
}: CreateStepProps) {
    const handleUserToggle = (userId: string) => {
        const currentMembers = formState.teamMembers
        const isSelected = currentMembers.includes(userId)

        if (isSelected) {
            // Remove user
            updateField(
                "teamMembers",
                currentMembers.filter((id) => id !== userId)
            )
        } else {
            // Add user (if not at max)
            if (currentMembers.length < 10) {
                updateField("teamMembers", [...currentMembers, userId])
            }
        }
    }

    return (
        <ScrollView className="flex-1 px-6">
            {/* Info Card */}
            <View className="bg-primary/10 rounded-lg border border-primary/20 p-4 mb-6">
                <Text className="text-text text-sm font-semibold mb-2">
                    Select Team Members
                </Text>
                <Text className="text-text text-opacity-60 text-xs">
                    Search for and add teammates to your project. You can add up
                    to 10 members.
                </Text>
            </View>

            {/* User Picker */}
            <UserPicker
                selectedUserIds={formState.teamMembers}
                onUserToggle={handleUserToggle}
                maxSelection={10}
                label="Team Members *"
                error={errors.teamMembers}
            />

            {/* Requirement note */}
            {formState.teamMembers.length === 0 && (
                <View className="bg-warn/10 rounded-lg p-3 mt-2">
                    <Text className="text-xs text-text text-opacity-80">
                        ⚠️ At least 1 team member is required to create a
                        project burrow.
                    </Text>
                </View>
            )}

            {/* Bottom spacing */}
            <View className="h-8" />
        </ScrollView>
    )
}
