import { View, ScrollView, KeyboardAvoidingView, Platform } from "react-native"
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
                {/* Project Name */}
                <Input
                    label="Project Name *"
                    value={formState.name}
                    onChangeText={(value) => updateField("name", value)}
                    placeholder="e.g., Final Research Paper"
                    error={errors.name}
                />

                {/* Class Name (optional) */}
                <Input
                    label="Class (optional)"
                    value={formState.className}
                    onChangeText={(value) => updateField("className", value)}
                    placeholder="e.g., CSCI 4041"
                    error={errors.className}
                />

                {/* Project Objective */}
                <Input
                    label="Project Objective *"
                    value={formState.objective}
                    onChangeText={(value) => updateField("objective", value)}
                    placeholder="What is the goal of this project? What needs to be accomplished?"
                    multiline
                    numberOfLines={5}
                    error={errors.objective}
                />

                <View className="h-32" />
            </ScrollView>
        </KeyboardAvoidingView>
    )
}
