import {
    View,
    Text,
    ScrollView,
    KeyboardAvoidingView,
    Platform
} from "react-native"
import { UserPicker } from "@components/core"
import type { CreateStepProps } from "../create.types"

export function MembersStep({
    errors,
    formState,
    updateField,
    isEditMode
}: CreateStepProps) {
    const handleUserToggle = (userId: string) => {
        if (isEditMode) return

        const currentMembers = formState.teamMembers
        const isSelected = currentMembers.includes(userId)

        if (isSelected) {
            updateField(
                "teamMembers",
                currentMembers.filter((id) => id !== userId)
            )
        } else if (currentMembers.length < 10) {
            updateField("teamMembers", [...currentMembers, userId])
        }
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1"
            keyboardVerticalOffset={Platform.OS === "ios" ? 120 : 0}
        >
            <ScrollView
                className="flex-1 px-6"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View className="bg-card rounded-lg border border-card-border p-4 mb-6">
                    <Text className="text-text text-sm font-semibold mb-2">
                        {isEditMode ? "Team Members" : "Select Team Members"}
                    </Text>

                    <Text className="text-text text-opacity-60 text-xs">
                        {isEditMode
                            ? "Team members can be changed through the invite menu."
                            : "Search for and add teammates to your project. You can add up to 10 members."}
                    </Text>
                </View>

                {!isEditMode && (
                    <UserPicker
                        selectedUserIds={formState.teamMembers}
                        onUserToggle={handleUserToggle}
                        maxSelection={10}
                        label="Team Members *"
                        error={errors.teamMembers}
                        disabled={isEditMode}
                    />
                )}

                {!isEditMode && formState.teamMembers.length === 0 && (
                    <View className="bg-warn/10 rounded-lg p-3 mt-2">
                        <Text className="text-xs text-text text-opacity-80">
                            At least 1 team member is required to create a
                            project burrow.
                        </Text>
                    </View>
                )}

                <View className="h-32" />
            </ScrollView>
        </KeyboardAvoidingView>
    )
}
