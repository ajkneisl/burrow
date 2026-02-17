import { useState, useCallback } from "react"
import {
    View,
    Text,
    Pressable,
    KeyboardAvoidingView,
    Platform
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { useAtom } from "jotai"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import Toast from "react-native-toast-message"
import { X, ChevronLeft } from "lucide-react-native"
import { Modal } from "@components/core"
import ThemedIcon from "@components/core/ThemedIcon"
import { createClubModalOpen } from "@features/layout/layout.atom"
import { createClub } from "@features/clubs/clubs.api"
import {
    CreateClubFormState,
    initialFormState
} from "@features/clubs/club.types"
import { useThemeColors } from "@api/theme/useThemeColors"
import ClubPrivacyStep from "@features/clubs/components/ClubPrivacyStep"
import ClubInfoStep from "@features/clubs/components/ClubInfoStep"

/**
 * Two-step wizard to create a Club.
 *
 * @author AJ Kneisl
 */
export default function CreateClubModal() {
    const router = useRouter()
    const queryClient = useQueryClient()
    const colors = useThemeColors()

    const [open, setOpen] = useAtom(createClubModalOpen)

    const [formState, setFormState] =
        useState<CreateClubFormState>(initialFormState)
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [currentStep, setCurrentStep] = useState(1)

    const totalSteps = 2

    // update a field to a new value
    const updateField = useCallback(
        <K extends keyof CreateClubFormState>(
            field: K,
            value: CreateClubFormState[K]
        ) => {
            setFormState((prev) => ({ ...prev, [field]: value }))
            if (errors[field]) {
                setErrors((prev) => {
                    const next = { ...prev }
                    delete next[field]
                    return next
                })
            }
        },
        [errors]
    )

    // ensure that the current step has valid inputs
    const validateCurrentStep = useCallback((): boolean => {
        const next: Record<string, string> = {}

        if (currentStep === 1) {
            // validate name
            const name = formState.name.trim()

            if (!name) {
                next.name = "Required"
            } else if (!/^[a-z0-9-]+$/.test(name)) {
                next.name = "Only lowercase letters, numbers, and hyphens"
            }

            // validate display name
            const displayName = formState.displayName.trim()

            if (!displayName) {
                next.displayName = "Required"
            } else if (displayName.length > 32) {
                next.displayName = "Must be 32 characters or fewer"
            }
        }

        setErrors(next)
        return Object.keys(next).length === 0
    }, [currentStep, formState])

    // when the club is created
    const createClubMutation = useMutation({
        mutationFn: async () => {
            return await createClub({
                name: formState.name.trim(),
                displayName: formState.displayName.trim(),
                description: formState.description.trim(),
                category: formState.category,
                privacy: formState.privacy,
                requestToJoin: formState.requestToJoin,
                members: []
            })
        },

        onSuccess: async (club) => {
            await queryClient.invalidateQueries({
                queryKey: ["clubs", "mine"]
            })
            await queryClient.invalidateQueries({
                queryKey: ["clubs", "discover"]
            })

            Toast.show({
                type: "success",
                text1: "Club created!",
                text2: `${formState.displayName.trim()} has been created.`
            })

            handleClose()
            router.push(`/club/${club.name}` as any)
        },

        onError: (error: any) => {
            Toast.show({
                type: "error",
                text1: "Failed to create club",
                text2: error?.message || error || "Please try again"
            })
        }
    })

    // handle next step
    const handleNext = useCallback(() => {
        if (!validateCurrentStep()) return
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1)
            setErrors({})
        }
    }, [currentStep, validateCurrentStep, totalSteps])

    // handle go back step
    const handleBack = useCallback(() => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
            setErrors({})
        }
    }, [currentStep])

    // handle submit
    const handleSubmit = useCallback(() => {
        if (!validateCurrentStep()) return
        createClubMutation.mutate()
    }, [validateCurrentStep, createClubMutation])

    // handle close
    const handleClose = () => {
        setOpen(false)
        setFormState(initialFormState)
        setErrors({})
        setCurrentStep(1)
    }

    return (
        <Modal
            visible={open}
            onClose={handleClose}
            size="full"
            scrollable={false}
        >
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
                            <Text className="text-xl font-bold text-text">
                                Create Club
                            </Text>
                            <Text className="text-sm text-text text-opacity-60">
                                Step {currentStep} of {totalSteps}:{" "}
                                {currentStep === 1
                                    ? "Club Details"
                                    : "Privacy Settings"}
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
                                index + 1 <= currentStep
                                    ? "bg-primary"
                                    : "bg-gray-200"
                            }`}
                        />
                    ))}
                </View>

                {/* Step Content */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    className="flex-1"
                    keyboardVerticalOffset={Platform.OS === "ios" ? 120 : 0}
                >
                    {currentStep === 1 ? (
                        <ClubInfoStep
                            updateField={updateField}
                            formState={formState}
                            errors={errors}
                        />
                    ) : (
                        <ClubPrivacyStep
                            updateField={updateField}
                            formState={formState}
                            errors={errors}
                        />
                    )}
                </KeyboardAvoidingView>

                {/* Footer */}
                <View className="px-6 py-4 border-t border-gray-200 flex-row gap-3">
                    <Pressable
                        onPress={handleClose}
                        disabled={createClubMutation.isPending}
                        className="flex-1 py-3 rounded-lg border border-error items-center"
                    >
                        <Text className="text-error font-semibold">Cancel</Text>
                    </Pressable>

                    {currentStep < totalSteps ? (
                        <Pressable
                            onPress={handleNext}
                            className="flex-1 py-3 rounded-lg bg-success items-center"
                        >
                            <Text className="text-white font-semibold">
                                Next
                            </Text>
                        </Pressable>
                    ) : (
                        <Pressable
                            onPress={handleSubmit}
                            disabled={createClubMutation.isPending}
                            className="flex-1 py-3 rounded-lg bg-success items-center"
                            style={{
                                opacity: createClubMutation.isPending ? 0.6 : 1
                            }}
                        >
                            <Text className="text-white font-semibold">
                                {createClubMutation.isPending
                                    ? "Creating..."
                                    : "Create"}
                            </Text>
                        </Pressable>
                    )}
                </View>
            </SafeAreaView>
        </Modal>
    )
}
