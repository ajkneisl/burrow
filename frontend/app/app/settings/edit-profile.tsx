import { View, Text, ScrollView, Pressable, KeyboardAvoidingView, Platform, FlatList } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter, Stack } from "expo-router"
import { ArrowLeft } from "lucide-react-native"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import Toast from "react-native-toast-message"
import { Input, Button, Card } from "@components/core"
import useProfile from "@features/auth/hooks/useProfile"
import { saveProfile } from "@features/auth/user.api"
import { useThemeColors } from "@api/theme/useThemeColors"
import useFormState from "@api/useFormState"
import type { Profile } from "@features/profile/profile.model"

type ProfileFormState = {
    name: string
    bio: string
    gradYear: string
    major: string
    instagram: string
    linkedIn: string
}

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

    const { formState, errors, setErrors, updateField, verify } =
        useFormState<ProfileFormState>({
            initial: {
                name: profile?.name || "",
                bio: profile?.bio || "",
                gradYear: profile?.gradYear ? profile.gradYear.toString() : "",
                major: profile?.major || "",
                instagram: profile?.instagram || "",
                linkedIn: profile?.linkedIn || ""
            },
            initialErrors: [] as string[],
            verifyEndpoint: "/user/profile/verify"
        })

    const saveMutation = useMutation({
        mutationFn: async () => {
            const verifyFields: Record<string, unknown> = {
                name: formState.name.trim()
            }

            if (formState.bio.trim())
                verifyFields.bio = formState.bio.trim()
            if (formState.gradYear)
                verifyFields.gradYear = parseInt(formState.gradYear)
            if (formState.instagram.trim())
                verifyFields.instagram = formState.instagram.trim()
            if (formState.linkedIn.trim())
                verifyFields.linkedIn = formState.linkedIn.trim()

            const valid = await verify(verifyFields)
            if (!valid) throw new Error("Validation failed")

            const updates: Partial<Profile> = {
                name: formState.name.trim(),
                visibility: profile!.visibility,
                bio: formState.bio.trim() || null,
                gradYear: formState.gradYear ? parseInt(formState.gradYear) : null,
                major: formState.major.trim() || null,
                instagram: formState.instagram.trim() || null,
                linkedIn: formState.linkedIn.trim() || null
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
                        value={formState.name}
                        onChangeText={(value) => updateField("name", value)}
                        placeholder="e.g., John Doe"
                        variant="outline"
                    />

                    <Input
                        label="Bio"
                        value={formState.bio}
                        onChangeText={(value) => updateField("bio", value)}
                        placeholder="Tell us about yourself..."
                        variant="outline"
                        multiline
                        numberOfLines={4}
                    />

                    <Input
                        label="Graduation Year"
                        value={formState.gradYear}
                        onChangeText={(value) =>
                            updateField("gradYear", value.replace(/\D/g, ""))
                        }
                        placeholder="e.g., 2025"
                        variant="outline"
                        keyboardType="numeric"
                    />

                    <Input
                        label="Major"
                        value={formState.major}
                        onChangeText={(value) => updateField("major", value)}
                        placeholder="e.g., Computer Science"
                        variant="outline"
                    />

                    <Input
                        label="Instagram"
                        value={formState.instagram}
                        onChangeText={(value) => updateField("instagram", value)}
                        placeholder="@username"
                        variant="outline"
                    />

                    <Input
                        label="LinkedIn"
                        value={formState.linkedIn}
                        onChangeText={(value) => updateField("linkedIn", value)}
                        placeholder="e.g., linkedin.com/in/johndoe"
                        variant="outline"
                    />

                    <View className="flex-1" />

                    {/* Server errors */}
                    {errors.length > 0 && (
                        <Card
                            variant="bordered"
                            className="mb-4"
                            style={{
                                backgroundColor: `${colors.error}3A`
                            }}
                        >
                            <FlatList
                                data={errors}
                                renderItem={(err) => (
                                    <Text>
                                        <Text className="font-semibold">
                                            {err.index + 1}.
                                        </Text>{" "}
                                        {err.item}
                                    </Text>
                                )}
                            />
                        </Card>
                    )}

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
                                setErrors([])
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
