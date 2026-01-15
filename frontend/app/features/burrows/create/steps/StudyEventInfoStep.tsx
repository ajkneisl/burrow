import {
    View,
    Text,
    ScrollView,
    KeyboardAvoidingView,
    Platform
} from "react-native"
import { Input } from "@components/core"
import { LocationSelector } from "@features/burrows/components/LocationSelector"
import type { CreateStepProps } from "../create.types"

export function StudyEventInfoStep({
    errors,
    formState,
    updateField
}: CreateStepProps) {
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
                {/* Info Card */}
                <View className="bg-primary/10 rounded-lg border border-primary/20 p-4 mb-6">
                    <Text className="text-text text-sm font-semibold mb-2">
                        Basic Information
                    </Text>
                    <Text className="text-text text-opacity-60 text-xs">
                        Add details about your {formState.kind.toLowerCase()}{" "}
                        session. Be specific about the topic and location to
                        help others find you.
                    </Text>
                </View>

                {/* Title */}
                <Input
                    label="Title *"
                    value={formState.title}
                    onChangeText={(value) => updateField("title", value)}
                    placeholder="e.g., PHYS 1301W Final"
                    variant="outline"
                    error={errors.title}
                />

                {/* Location */}
                <View className="mb-4">
                    <Text className="text-sm font-semibold text-text mb-2">
                        Location *
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
                    variant="outline"
                    keyboardType="numeric"
                />

                {/* Tags */}
                <Input
                    label="Tags (comma separated)"
                    value={formState.tags}
                    onChangeText={(value) => updateField("tags", value)}
                    placeholder="e.g., PHYS, FINAL"
                    variant="outline"
                />

                {/* Description */}
                <Input
                    label="Description"
                    value={formState.description}
                    onChangeText={(value) => updateField("description", value)}
                    placeholder="What're you studying? Who are you looking for?"
                    variant="outline"
                    multiline
                    numberOfLines={4}
                />

                <View className="h-32" />
            </ScrollView>
        </KeyboardAvoidingView>
    )
}
