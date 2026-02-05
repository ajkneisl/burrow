import { useState } from "react"
import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter, Stack } from "expo-router"
import { ArrowLeft } from "lucide-react-native"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import Toast from "react-native-toast-message"
import { Input, Button } from "@components/core"
import useProfile from "@features/auth/hooks/useProfile"
import { saveProfile } from "@features/auth/user.api"
import { useThemeColors } from "@api/theme/useThemeColors"
import type { Profile } from "@features/profile/profile.model"

/**
 * Edit profile settings page.
 *
 * @author AJ Kneisl
 */
export default function EditProfileScreen() {
    const router = useRouter()
    const profile = useProfile()
    const colors = useThemeColors()
    const queryClient = useQueryClient()

    const [name, setName] = useState(profile?.name || "")
    const [bio, setBio] = useState(profile?.bio || "")
    const [gradYear, setGradYear] = useState(
        profile?.gradYear ? profile.gradYear.toString() : ""
    )
    const [major, setMajor] = useState(profile?.major || "")
    const [instagram, setInstagram] = useState(profile?.instagram || "")
    const [linkedIn, setLinkedIn] = useState(profile?.linkedIn || "")
    const [errors, setErrors] = useState<Record<string, string>>({})

    const saveMutation = useMutation({
        mutationFn: async () => {
            const validationErrors: Record<string, string> = {}

            if (!name.trim()) {
                validationErrors.name = "Please enter your name"
            } else if (name.trim().length < 2) {
                validationErrors.name = "Name must be at least 2 characters"
            }

            if (gradYear) {
                const year = parseInt(gradYear)
                if (isNaN(year) || year < 2020 || year > 2035) {
                    validationErrors.gradYear =
                        "Please enter a valid year between 2020 and 2035"
                }
            }

            if (instagram.trim()) {
                const instaValue = instagram.trim()
                if (!instaValue.startsWith("@")) {
                    validationErrors.instagram =
                        "Instagram handle must start with @ (e.g., @johndoe)"
                } else if (instaValue.length < 2) {
                    validationErrors.instagram =
                        "Please enter a valid Instagram handle"
                } else if (!/^@[a-zA-Z0-9._]+$/.test(instaValue)) {
                    validationErrors.instagram =
                        "Instagram handle can only contain letters, numbers, periods, and underscores"
                }
            }

            if (Object.keys(validationErrors).length > 0) {
                setErrors(validationErrors)
                throw new Error("Validation failed")
            }

            const updates: Partial<Profile> = {
                name: name.trim(),
                visibility: profile!.visibility,
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

            router.back()
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

    if (!profile) {
        return (
            <SafeAreaView className="flex-1 bg-background">
                <Stack.Screen options={{ headerShown: false }} />
                <View className="flex-1 items-center justify-center">
                    <Text className="text-text opacity-60">Loading...</Text>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView className="flex-1 bg-background">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="px-6 py-4 border-b border-card-border flex-row items-center">
                <Pressable onPress={() => router.back()} className="p-2 mr-2">
                    <ArrowLeft size={24} color={colors.text} />
                </Pressable>

                <Text className="text-2xl font-bold text-text">Edit Profile</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <ScrollView className="flex-1 px-6 py-4" contentContainerStyle={{ flexGrow: 1 }}>
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

                    <Input
                        label="Bio"
                        value={bio}
                        onChangeText={setBio}
                        placeholder="Tell us about yourself..."
                        variant="outline"
                        multiline
                        numberOfLines={4}
                    />

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

                    <Input
                        label="Major"
                        value={major}
                        onChangeText={setMajor}
                        placeholder="e.g., Computer Science"
                        variant="outline"
                    />

                    <Input
                        label="Instagram"
                        value={instagram}
                        onChangeText={(value) => {
                            setInstagram(value)
                            if (errors.instagram) {
                                setErrors((prev) => {
                                    const next = { ...prev }
                                    delete next.instagram
                                    return next
                                })
                            }
                        }}
                        placeholder="@username"
                        variant="outline"
                        error={errors.instagram}
                    />

                    <Input
                        label="LinkedIn"
                        value={linkedIn}
                        onChangeText={setLinkedIn}
                        placeholder="e.g., linkedin.com/in/johndoe"
                        variant="outline"
                    />

                    <View className="flex-1" />

                    <View className="flex-row gap-3 mt-6 mb-4">
                        <Button
                            variant="outline"
                            onPress={() => router.back()}
                            className="flex-1"
                            disabled={saveMutation.isPending}
                        >
                            Cancel
                        </Button>

                        <Button
                            variant="primary"
                            onPress={() => {
                                setErrors({})
                                saveMutation.mutate()
                            }}
                            className="flex-1"
                            loading={saveMutation.isPending}
                        >
                            Save
                        </Button>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}
