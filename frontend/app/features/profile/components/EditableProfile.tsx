import { useState } from "react"
import { View, ScrollView, KeyboardAvoidingView, Platform } from "react-native"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import Toast from "react-native-toast-message"
import { Input, Button } from "@components/core"
import type { Profile } from "../profile.model"
import { saveProfile } from "@features/auth/user.api"

/**
 * {@link EditableProfile}
 */
type EditableProfileProps = {
    profile: Profile
    onCancel: () => void
    onSave: () => void
}

/**
 * An editable profile.
 *
 * @param profile The profile to edit.
 * @param onCancel When the editing is cancelled.
 * @param onSave When saving the Burrow.
 * @constructor
 */
export function EditableProfile({
    profile,
    onCancel,
    onSave
}: EditableProfileProps) {
    const queryClient = useQueryClient()

    const [name, setName] = useState(profile.name || "")
    const [bio, setBio] = useState(profile.bio || "")
    const [gradYear, setGradYear] = useState(
        profile.gradYear ? profile.gradYear.toString() : ""
    )
    const [major, setMajor] = useState(profile.major || "")
    const [instagram, setInstagram] = useState(profile.instagram || "")
    const [linkedIn, setLinkedIn] = useState(profile.linkedIn || "")
    const [errors, setErrors] = useState<Record<string, string>>({})

    const saveMutation = useMutation({
        mutationFn: async () => {
            const validationErrors: Record<string, string> = {}

            // validate name
            if (!name.trim()) {
                validationErrors.name = "Name is required"
            }

            // validate grad year
            if (
                gradYear &&
                (parseInt(gradYear) < 2020 || parseInt(gradYear) > 2035)
            ) {
                validationErrors.gradYear = "Year must be between 2020-2035"
            }

            // check if failed
            if (Object.keys(validationErrors).length > 0) {
                setErrors(validationErrors)
                throw new Error("Validation failed")
            }

            const updates: Partial<Profile> = {
                name: name.trim(),
                visibility: profile.visibility,
                bio: bio.trim() || null,
                gradYear: gradYear ? parseInt(gradYear) : null,
                major: major.trim() || null,
                instagram: instagram.trim() || null,
                linkedIn: linkedIn.trim() || null
            }

            return await saveProfile(updates)
        },

        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ["user"] })
            void queryClient.invalidateQueries({ queryKey: ["profile"] })

            Toast.show({
                type: "success",
                text1: "Profile updated",
                text2: "Your profile has been saved successfully"
            })

            onSave()
        },

        onError: (error: any) => {
            if (error.message !== "Validation failed") {
                Toast.show({
                    type: "error",
                    text1: "Failed to save profile",
                    text2: error.message || "Please try again"
                })
            }
        }
    })

    const handleSave = () => {
        setErrors({})
        saveMutation.mutate()
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1"
        >
            <ScrollView className="flex-1">
                {/* Name */}
                <Input
                    label="Full Name *"
                    value={name}
                    onChangeText={(value) => {
                        setName(value)
                        if (errors.name) {
                            setErrors((prev) => {
                                const next = { ...prev }
                                delete next.name
                                return next
                            })
                        }
                    }}
                    placeholder="e.g., John Doe"
                    variant="outline"
                    error={errors.name}
                />

                {/* Bio */}
                <Input
                    label="Bio"
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Tell us about yourself..."
                    variant="outline"
                    multiline
                    numberOfLines={4}
                />

                {/* Graduation Year */}
                <Input
                    label="Graduation Year"
                    value={gradYear}
                    onChangeText={(value) => {
                        setGradYear(value.replace(/\D/g, ""))
                        if (errors.gradYear) {
                            setErrors((prev) => {
                                const next = { ...prev }
                                delete next.gradYear
                                return next
                            })
                        }
                    }}
                    placeholder="e.g., 2025"
                    variant="outline"
                    keyboardType="numeric"
                    error={errors.gradYear}
                />

                {/* Major */}
                <Input
                    label="Major"
                    value={major}
                    onChangeText={setMajor}
                    placeholder="e.g., Computer Science"
                    variant="outline"
                />

                {/* Instagram */}
                <Input
                    label="Instagram"
                    value={instagram}
                    onChangeText={setInstagram}
                    placeholder="e.g., johndoe or instagram.com/johndoe"
                    variant="outline"
                />

                {/* LinkedIn */}
                <Input
                    label="LinkedIn"
                    value={linkedIn}
                    onChangeText={setLinkedIn}
                    placeholder="e.g., linkedin.com/in/johndoe"
                    variant="outline"
                />

                {/* Actions */}
                <View className="flex-row gap-3 mt-6 mb-8">
                    <Button
                        variant="outline"
                        onPress={onCancel}
                        className="flex-1"
                        disabled={saveMutation.isPending}
                    >
                        Cancel
                    </Button>

                    <Button
                        variant="primary"
                        onPress={handleSave}
                        className="flex-1"
                        loading={saveMutation.isPending}
                    >
                        Save
                    </Button>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}
