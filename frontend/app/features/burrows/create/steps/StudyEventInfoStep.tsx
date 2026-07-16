import { View, ScrollView, KeyboardAvoidingView, Platform } from "react-native"
import { Input, Text } from "@components/core"
import { LocationSelector } from "@features/burrows/components/LocationSelector"
import type { CreateStepProps } from "../create.types"

/**
 * Info step for creating a Study / Event Burrow
 *
 * @param errors Any errors in the fields.
 * @param formState The state of the form.
 * @param updateField When a field is updated.
 *
 * @author AJ Kneisl
 */
export function StudyEventInfoStep({
    errors,
    formState,
    updateField
}: CreateStepProps) {
    // handle when capacity changed
    const handleCapacityChange = (value: string) => {
        if (value === "") {
            updateField("capacity", 0)
            return
        }

        const num = parseInt(value.replace(/\D/g, ""), 10)

        if (!isNaN(num)) {
            updateField("capacity", num)
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
                {/* title */}
                <Input
                    label="Title *"
                    value={formState.title}
                    onChangeText={(value) => updateField("title", value)}
                    placeholder="Calculus Final Cram"
                    error={errors.title}
                />

                {/* location */}
                <View className="mb-4">
                    <Text className="text-sm font-semibold text-text mb-2">
                        Location
                    </Text>

                    <LocationSelector
                        value={formState.location}
                        onLocationSelect={(loc) => {
                            updateField("location", loc.address)
                        }}
                    />

                    {errors.location && (
                        <Text className="text-sm text-error mt-1">
                            {errors.location}
                        </Text>
                    )}
                </View>

                {/* Capacity */}
                <Input
                    label="Max Participants (optional)"
                    value={
                        formState.capacity > 0
                            ? formState.capacity.toString()
                            : ""
                    }
                    onChangeText={handleCapacityChange}
                    placeholder="Leave empty for unlimited"
                    keyboardType="numeric"
                    error={errors.capacity}
                />

                {/* Tags */}
                <Input
                    label="Tags (comma separated)"
                    value={formState.tags}
                    onChangeText={(value) => updateField("tags", value)}
                    placeholder="CALC, STUDY, FINAL"
                    error={errors.tags}
                />

                {/* Description */}
                <Input
                    label="Description"
                    value={formState.description}
                    onChangeText={(value) => updateField("description", value)}
                    placeholder="What're you studying? Who are you looking for?"
                    multiline
                    numberOfLines={4}
                    error={errors.description}
                />

                <View className="h-32" />
            </ScrollView>
        </KeyboardAvoidingView>
    )
}
