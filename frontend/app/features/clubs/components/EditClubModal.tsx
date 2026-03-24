import { useState, useCallback } from "react"
import { View, Pressable, ScrollView, Switch, KeyboardAvoidingView, Platform, FlatList } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import Toast from "react-native-toast-message"
import { X, ChevronLeft } from "lucide-react-native"
import { Card, Input, Modal, Text } from "@components/core"
import ThemedIcon from "@components/core/ThemedIcon"
import { updateClub } from "@features/clubs/clubs.api"
import type {
    Club,
    ClubCategory,
    ClubLink,
    ClubPrivacy
} from "@features/clubs/club.types"
import { CLUB_CATEGORIES, CLUB_PRIVACY_OPTIONS } from "@features/clubs/club.types"
import { useThemeColors } from "@api/theme/useThemeColors"
import ClubLinksEditor from "@features/clubs/components/ClubLinksEditor"

type EditClubFormState = {
    displayName: string
    description: string
    links: Partial<Record<ClubLink, string>>
    category: ClubCategory
    privacy: ClubPrivacy
    requestToJoin: boolean
}

type EditClubModalProps = {
    visible: boolean
    onClose: () => void
    club: Club
}

/**
 * Two-step wizard to edit a Club.
 *
 * @author AJ Kneisl
 */
export default function EditClubModal({ visible, onClose, club }: EditClubModalProps) {
    const queryClient = useQueryClient()
    const colors = useThemeColors()

    const [formState, setFormState] = useState<EditClubFormState>(() => ({
        displayName: club.displayName,
        description: club.description,
        links: club.links ?? {},
        category: club.category,
        privacy: club.privacy,
        requestToJoin: club.requestToJoin,
    }))
    const [errors, setErrors] = useState<string[]>([])
    const [currentStep, setCurrentStep] = useState(1)

    const totalSteps = 2

    const updateField = useCallback(
        <K extends keyof EditClubFormState>(field: K, value: EditClubFormState[K]) => {
            setFormState((prev) => ({ ...prev, [field]: value }))
        },
        []
    )

    const validateCurrentStep = useCallback((): boolean => {
        if (currentStep === 1) {
            if (!formState.displayName.trim()) {
                setErrors(["Display name is required"])
                return false
            }
            if (formState.displayName.trim().length > 32) {
                setErrors(["Display name must be 32 characters or fewer"])
                return false
            }
        }
        setErrors([])
        return true
    }, [currentStep, formState.displayName])

    const updateClubMutation = useMutation({
        mutationFn: async () => {
            await updateClub(club.name, {
                name: club.name,
                displayName: formState.displayName.trim(),
                description: formState.description.trim(),
                links: formState.links,
                category: formState.category,
                privacy: formState.privacy,
                requestToJoin: formState.requestToJoin,
                members: [],
            })
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["club", club.name] })
            Toast.show({ type: "success", text1: "Club updated!" })
            handleClose()
        },
        onError: (error: any) => {
            if (Array.isArray(error)) {
                setErrors(error as string[])
            } else {
                setErrors([error?.message || error || "Please try again"])
            }
        },
    })

    const handleNext = useCallback(() => {
        if (!validateCurrentStep()) return
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1)
            setErrors([])
        }
    }, [currentStep, validateCurrentStep])

    const handleBack = useCallback(() => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
            setErrors([])
        }
    }, [currentStep])

    const handleSubmit = useCallback(() => {
        if (!validateCurrentStep()) return
        updateClubMutation.mutate()
    }, [validateCurrentStep, updateClubMutation])

    const handleClose = useCallback(() => {
        setFormState({
            displayName: club.displayName,
            description: club.description,
            links: club.links ?? {},
            category: club.category,
            privacy: club.privacy,
            requestToJoin: club.requestToJoin,
        })
        setErrors([])
        setCurrentStep(1)
        onClose()
    }, [club, onClose])

    return (
        <Modal visible={visible} onClose={handleClose} size="full" scrollable={false}>
            <SafeAreaView className="flex-1 bg-background">
                {/* Header */}
                <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
                    <View className="flex-row items-center">
                        {currentStep > 1 && (
                            <Pressable onPress={handleBack} className="mr-3">
                                <ChevronLeft size={24} color={colors.text} />
                            </Pressable>
                        )}
                        <View>
                            <Text className="text-xl font-bold text-text">Edit Club</Text>
                            <Text className="text-sm text-text text-opacity-60">
                                Step {currentStep} of {totalSteps}:{" "}
                                {currentStep === 1 ? "Club Details" : "Privacy Settings"}
                            </Text>
                        </View>
                    </View>
                    <Pressable onPress={handleClose}>
                        <ThemedIcon icon={X} size={24} />
                    </Pressable>
                </View>

                {/* Progress */}
                <View className="px-6 py-3 flex-row gap-2">
                    {Array.from({ length: totalSteps }).map((_, index) => (
                        <View
                            key={index}
                            className={`flex-1 h-2 rounded-full ${
                                index + 1 <= currentStep ? "bg-primary" : "bg-gray-200"
                            }`}
                        />
                    ))}
                </View>

                {/* Server errors */}
                {errors.length > 0 && (
                    <Card
                        variant="bordered"
                        className="mx-6"
                        style={{ backgroundColor: `${colors.error}3A` }}
                    >
                        <FlatList
                            data={errors}
                            renderItem={(err) => (
                                <Text>
                                    <Text className="font-semibold">{err.index + 1}.</Text>{" "}
                                    {err.item}
                                </Text>
                            )}
                        />
                    </Card>
                )}

                {/* Step Content */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    className="flex-1"
                    keyboardVerticalOffset={Platform.OS === "ios" ? 120 : 0}
                >
                    {currentStep === 1 ? (
                        <ScrollView
                            className="flex-1 px-6"
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            <View className="bg-card rounded-lg border border-card-border p-4 mb-6">
                                <Text className="text-text text-sm font-semibold mb-2">
                                    Club Details
                                </Text>
                                <Text className="text-text text-opacity-60 text-xs">
                                    Update your club's details. The club URL name cannot be changed.
                                </Text>
                            </View>

                            <Input
                                label="Club Name"
                                value={club.name}
                                editable={false}
                                variant="outline"
                            />

                            <Input
                                label="Display Name *"
                                value={formState.displayName}
                                onChangeText={(value) => updateField("displayName", value)}
                                placeholder="My Club"
                                variant="outline"
                            />

                            {/* Category */}
                            <View className="mb-4">
                                <Text className="text-sm font-semibold text-text mb-3">
                                    Category
                                </Text>
                                <View className="flex-row flex-wrap gap-2">
                                    {CLUB_CATEGORIES.map((cat) => (
                                        <Pressable
                                            key={cat.value}
                                            onPress={() => updateField("category", cat.value)}
                                            className={`px-4 py-2 rounded-full border ${
                                                formState.category === cat.value
                                                    ? "bg-primary border-primary"
                                                    : "bg-card border-card-border"
                                            }`}
                                        >
                                            <Text
                                                className={`text-sm font-semibold ${
                                                    formState.category === cat.value
                                                        ? "text-white"
                                                        : "text-text"
                                                }`}
                                            >
                                                {cat.label}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>

                            <Input
                                label="Description"
                                value={formState.description}
                                onChangeText={(value) => updateField("description", value)}
                                placeholder="What is your club about?"
                                numberOfLines={4}
                                multiline
                            />

                            {/* Links */}
                            <View className="mb-4">
                                <Text className="text-sm font-semibold text-text mb-3">
                                    Links
                                </Text>
                                <ClubLinksEditor
                                    links={formState.links}
                                    onChange={(links) => updateField("links", links)}
                                />
                            </View>

                            <View className="h-32" />
                        </ScrollView>
                    ) : (
                        <ScrollView
                            className="flex-1 px-6"
                            showsVerticalScrollIndicator={false}
                        >
                            <View className="bg-card rounded-lg border border-card-border p-4 mb-6">
                                <Text className="text-text text-sm font-semibold mb-2">
                                    Privacy Settings
                                </Text>
                                <Text className="text-text text-opacity-60 text-xs">
                                    Control who can see and join your club.
                                </Text>
                            </View>

                            <View className="mb-6">
                                <Text className="text-base font-semibold text-text mb-3">
                                    Club Privacy
                                </Text>
                                {CLUB_PRIVACY_OPTIONS.map((option) => {
                                    const Icon = option.icon
                                    const isSelected = formState.privacy === option.value

                                    return (
                                        <Pressable
                                            key={option.value}
                                            onPress={() => updateField("privacy", option.value)}
                                            style={{
                                                backgroundColor: isSelected
                                                    ? `${colors.primary}2A`
                                                    : colors.background
                                            }}
                                            className={`flex-row items-center p-4 mb-3 rounded-lg border ${
                                                isSelected ? "border-primary" : "border-card-border"
                                            }`}
                                        >
                                            <View
                                                className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                                                    isSelected ? "bg-primary" : "bg-card"
                                                }`}
                                            >
                                                <Icon
                                                    size={20}
                                                    color={isSelected ? "#FFFFFF" : "#6B7280"}
                                                />
                                            </View>
                                            <View className="flex-1">
                                                <Text
                                                    className={`text-base font-semibold ${
                                                        isSelected ? "text-primary" : "text-text"
                                                    }`}
                                                >
                                                    {option.label}
                                                </Text>
                                                <Text className="text-sm text-text text-opacity-60">
                                                    {option.description}
                                                </Text>
                                            </View>
                                            <View
                                                className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                                                    isSelected ? "border-primary" : "border-card-border"
                                                }`}
                                            >
                                                {isSelected && (
                                                    <View className="w-3 h-3 rounded-full bg-primary" />
                                                )}
                                            </View>
                                        </Pressable>
                                    )
                                })}
                            </View>

                            <View className="border-t border-gray-200 pt-6">
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-1 pr-4">
                                        <Text className="text-base font-semibold text-text mb-1">
                                            Require approval to join
                                        </Text>
                                        <Text className="text-sm text-text text-opacity-60">
                                            Users must request to join and wait for approval from an
                                            administrator or moderator
                                        </Text>
                                    </View>
                                    <Switch
                                        value={formState.requestToJoin}
                                        onValueChange={(value) => updateField("requestToJoin", value)}
                                        trackColor={{ false: "#D1D5DB", true: "#7A0019" }}
                                        thumbColor="#FFFFFF"
                                    />
                                </View>
                            </View>

                            <View className="h-8" />
                        </ScrollView>
                    )}
                </KeyboardAvoidingView>

                {/* Footer */}
                <View className="px-6 py-4 border-t border-gray-200 flex-row gap-3">
                    <Pressable
                        onPress={handleClose}
                        disabled={updateClubMutation.isPending}
                        className="flex-1 py-3 rounded-lg border border-error items-center"
                    >
                        <Text className="text-error font-semibold">Cancel</Text>
                    </Pressable>

                    {currentStep < totalSteps ? (
                        <Pressable
                            onPress={handleNext}
                            className="flex-1 py-3 rounded-lg bg-success items-center"
                        >
                            <Text className="text-white font-semibold">Next</Text>
                        </Pressable>
                    ) : (
                        <Pressable
                            onPress={handleSubmit}
                            disabled={updateClubMutation.isPending}
                            className="flex-1 py-3 rounded-lg bg-success items-center"
                            style={{ opacity: updateClubMutation.isPending ? 0.6 : 1 }}
                        >
                            <Text className="text-white font-semibold">
                                {updateClubMutation.isPending ? "Saving..." : "Save"}
                            </Text>
                        </Pressable>
                    )}
                </View>
            </SafeAreaView>
        </Modal>
    )
}
