import {
    View,
    Text,
    ScrollView,
    KeyboardAvoidingView,
    Platform
} from "react-native"
import { Input } from "@components/core"
import type { CreateStepProps } from "../create.types"

export function ProjectInfoStep({
    errors,
    formState,
    updateField
}: CreateStepProps) {
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
                <View className="bg-card rounded-lg border border-card-border p-4 mb-6">
                    <Text className="text-text text-sm font-semibold mb-2">
                        Project Details
                    </Text>
                    <Text className="text-text text-opacity-60 text-xs">
                        Provide information about your project. This will help
                        teammates understand the goal and scope.
                    </Text>
                </View>

                {/* Project Name */}
                <Input
                    label="Project Name *"
                    value={formState.name}
                    onChangeText={(value) => updateField("name", value)}
                    placeholder="e.g., Final Research Paper"
                    variant="outline"
                    error={errors.name}
                />

                {/* Class Name (optional) */}
                <Input
                    label="Class (optional)"
                    value={formState.className}
                    onChangeText={(value) => updateField("className", value)}
                    placeholder="e.g., CSCI 4041"
                    variant="outline"
                />

                {/* Project Objective */}
                <Input
                    label="Project Objective *"
                    value={formState.objective}
                    onChangeText={(value) => updateField("objective", value)}
                    placeholder="What is the goal of this project? What needs to be accomplished?"
                    variant="outline"
                    multiline
                    numberOfLines={5}
                    error={errors.objective}
                />

                <View className="h-32" />
            </ScrollView>
        </KeyboardAvoidingView>
    )
}
