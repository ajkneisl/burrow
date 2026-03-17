import { useState, useMemo } from "react"
import {
    View,
    ScrollView,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    FlatList,
    TextInput
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter, Stack } from "expo-router"
import {
    ArrowLeft,
    ChevronRight,
    Search,
    X
} from "lucide-react-native"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import Toast from "react-native-toast-message"
import { Input, Button, Card, Text, Modal } from "@components/core"
import useProfile from "@features/auth/hooks/useProfile"
import { saveProfile } from "@features/auth/user.api"
import { useThemeColors } from "@api/theme/useThemeColors"
import useFormState from "@api/useFormState"
import { majorInfo } from "@features/profile/schools"

type ProfileFormState = {
    name: string
    bio: string
    gradYear: string
    school: string
    major: string
    classes: string
    instagram: string
    linkedIn: string
    phoneNumber: string
}

type PickerModalProps = {
    visible: boolean
    onClose: () => void
    title: string
    options: string[]
    onSelect: (value: string) => void
}

function PickerModal({
    visible,
    onClose,
    title,
    options,
    onSelect
}: PickerModalProps) {
    const [search, setSearch] = useState("")
    const colors = useThemeColors()

    const filtered = useMemo(() => {
        if (!search) return options
        const q = search.toLowerCase()
        return options.filter((o) => o.toLowerCase().includes(q))
    }, [options, search])

    return (
        <Modal visible={visible} onClose={onClose} title={title} scrollable={false} size="full">
            <View className="px-4 py-2">
                <View className="flex-row items-center bg-card border border-card-border rounded-lg px-3">
                    <Search size={16} color={colors.text} opacity={0.4} />
                    <TextInput
                        className="flex-1 px-3 py-3 text-base text-text"
                        placeholder={`Search ${title.toLowerCase()}...`}
                        placeholderTextColor="#9CA3AF"
                        value={search}
                        onChangeText={setSearch}
                        autoFocus
                    />
                    {search.length > 0 && (
                        <Pressable onPress={() => setSearch("")}>
                            <X size={16} color={colors.text} opacity={0.4} />
                        </Pressable>
                    )}
                </View>
            </View>

            <FlatList
                data={filtered}
                keyExtractor={(item) => item}
                className="flex-1"
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                    <Pressable
                        onPress={() => {
                            onSelect(item)
                            setSearch("")
                            onClose()
                        }}
                        className="py-3.5 border-b border-card-border"
                    >
                        <Text className="text-text text-base">{item}</Text>
                    </Pressable>
                )}
                ListEmptyComponent={
                    <View className="py-8 items-center">
                        <Text className="text-text opacity-40 text-sm">No results</Text>
                    </View>
                }
            />
        </Modal>
    )
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

    const [schoolPickerOpen, setSchoolPickerOpen] = useState(false)
    const [majorPickerOpen, setMajorPickerOpen] = useState(false)

    const { formState, errors, setErrors, updateField } =
        useFormState<ProfileFormState>({
            initial: {
                name: profile?.name || "",
                bio: profile?.bio || "",
                gradYear: profile?.gradYear ? profile.gradYear.toString() : "",
                school: profile?.school || "",
                major: profile?.major || "",
                classes: profile?.classes?.join(", ") || "",
                instagram: profile?.instagram || "",
                linkedIn: profile?.linkedIn || "",
                phoneNumber: profile?.phoneNumber || ""
            },
            initialErrors: [] as string[]
        })

    const schoolOptions = useMemo(
        () => majorInfo.map((s) => s.name),
        []
    )

    const majorOptions = useMemo(() => {
        const selected = majorInfo.find(
            (s) => s.name === formState.school || s.shorthand === formState.school
        )
        if (!selected) {
            return majorInfo.flatMap((s) => s.majors)
        }
        return selected.majors
    }, [formState.school])

    const saveMutation = useMutation({
        mutationFn: async () => {
            const classesArray = formState.classes
                .split(",")
                .map((c) => c.trim().toUpperCase())
                .filter(Boolean)

            return await saveProfile({
                name: formState.name.trim(),
                visibility: profile!.visibility,
                bio: formState.bio.trim() || null,
                gradYear: formState.gradYear ? parseInt(formState.gradYear) : null,
                school: formState.school.trim() || null,
                major: formState.major.trim() || null,
                classes: classesArray.length > 0 ? classesArray : null,
                instagram: formState.instagram.trim() || null,
                linkedIn: formState.linkedIn.trim() || null,
                phoneNumber: formState.phoneNumber.trim() || null
            })
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
            if (Array.isArray(error)) {
                setErrors(error)
            } else {
                Toast.show({
                    type: "error",
                    text1: "Failed to save profile",
                    text2: typeof error === "string" ? error : error.message || "Please try again"
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
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ paddingBottom: 40 }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Profile Section */}
                    <View className="px-6 pt-6 pb-2">
                        <Text className="text-xs font-semibold text-text opacity-40 uppercase tracking-wider mb-3">
                            Profile
                        </Text>
                    </View>

                    <View className="px-6">
                        <Input
                            label="Full Name *"
                            value={formState.name}
                            onChangeText={(value) => updateField("name", value)}
                            placeholder="e.g., John Doe"
                        />

                        <Input
                            label="Bio"
                            value={formState.bio}
                            onChangeText={(value) => updateField("bio", value)}
                            placeholder="Tell us about yourself..."
                            multiline
                            numberOfLines={4}
                        />
                    </View>

                    {/* School Info Section */}
                    <View className="px-6 pt-4 pb-2">
                        <Text className="text-xs font-semibold text-text opacity-40 uppercase tracking-wider mb-3">
                            School Info
                        </Text>
                    </View>

                    <View className="px-6">
                        {/* School Picker */}
                        <View className="mb-4">
                            <Text className="text-sm font-semibold text-text mb-2">
                                School
                            </Text>
                            <Pressable
                                onPress={() => setSchoolPickerOpen(true)}
                                className="flex-row items-center justify-between bg-card border border-card-border rounded-lg px-4 py-3.5"
                            >
                                <Text
                                    className={`text-base ${formState.school ? "text-text" : "opacity-40 text-text"}`}
                                >
                                    {formState.school || "Select a school"}
                                </Text>
                                <ChevronRight size={18} color={colors.text} opacity={0.4} />
                            </Pressable>
                            {formState.school && (
                                <Pressable onPress={() => {
                                    updateField("school", "")
                                    updateField("major", "")
                                }}>
                                    <Text className="text-xs text-error mt-1">Clear school</Text>
                                </Pressable>
                            )}
                        </View>

                        {/* Major Picker */}
                        <View className="mb-4">
                            <Text className="text-sm font-semibold text-text mb-2">
                                Major
                            </Text>
                            <Pressable
                                onPress={() => setMajorPickerOpen(true)}
                                className="flex-row items-center justify-between bg-card border border-card-border rounded-lg px-4 py-3.5"
                            >
                                <Text
                                    className={`text-base ${formState.major ? "text-text" : "opacity-40 text-text"}`}
                                >
                                    {formState.major || "Select a major"}
                                </Text>
                                <ChevronRight size={18} color={colors.text} opacity={0.4} />
                            </Pressable>
                            {formState.school && (
                                <Text className="text-xs text-text opacity-40 mt-1">
                                    Showing majors for {formState.school}
                                </Text>
                            )}
                            {formState.major && (
                                <Pressable onPress={() => updateField("major", "")}>
                                    <Text className="text-xs text-error mt-1">Clear major</Text>
                                </Pressable>
                            )}
                        </View>

                        <Input
                            label="Graduation Year"
                            value={formState.gradYear}
                            onChangeText={(value) =>
                                updateField("gradYear", value.replace(/\D/g, ""))
                            }
                            placeholder="e.g., 2028"
                            keyboardType="numeric"
                            maxLength={4}
                        />

                        <Input
                            label="Classes"
                            value={formState.classes}
                            onChangeText={(value) => updateField("classes", value)}
                            placeholder="CSCI 2021, MATH 1271, CSCI 1933H"
                            helperText="Separate classes with commas"
                        />
                    </View>

                    {/* Contact Section */}
                    <View className="px-6 pt-4 pb-2">
                        <Text className="text-xs font-semibold text-text opacity-40 uppercase tracking-wider mb-3">
                            Contact
                        </Text>
                    </View>

                    <View className="px-6">
                        <Input
                            label="Instagram"
                            value={formState.instagram}
                            onChangeText={(value) => updateField("instagram", value)}
                            placeholder="@username"
                            autoCapitalize="none"
                        />

                        <Input
                            label="LinkedIn"
                            value={formState.linkedIn}
                            onChangeText={(value) => updateField("linkedIn", value)}
                            placeholder="linkedin.com/in/johndoe"
                            autoCapitalize="none"
                        />

                        <Input
                            label="Phone Number"
                            value={formState.phoneNumber}
                            onChangeText={(value) => updateField("phoneNumber", value)}
                            placeholder="(612) 555-1234"
                            keyboardType="phone-pad"
                        />
                    </View>

                    {/* Server errors */}
                    {errors.length > 0 && (
                        <View className="px-6 mt-4">
                            <Card
                                variant="bordered"
                                style={{
                                    backgroundColor: `${colors.error}3A`
                                }}
                            >
                                <FlatList
                                    scrollEnabled={false}
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
                        </View>
                    )}

                    <View className="flex-row gap-3 mt-6 px-6">
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

            {/* Picker Modals */}
            <PickerModal
                visible={schoolPickerOpen}
                onClose={() => setSchoolPickerOpen(false)}
                title="School"
                options={schoolOptions}
                onSelect={(value) => {
                    updateField("school", value)
                    updateField("major", "")
                }}
            />

            <PickerModal
                visible={majorPickerOpen}
                onClose={() => setMajorPickerOpen(false)}
                title="Major"
                options={majorOptions}
                onSelect={(value) => updateField("major", value)}
            />
        </SafeAreaView>
    )
}
