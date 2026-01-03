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
        >
            <ScrollView className="flex-1 px-6">
                {/* Info Card */}
                <View className="bg-primary/10 rounded-lg border border-primary/20 p-4 mb-6">
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

                {/* Bottom spacing for keyboard */}
                <View className="h-8" />
            </ScrollView>
        </KeyboardAvoidingView>
    )
}
