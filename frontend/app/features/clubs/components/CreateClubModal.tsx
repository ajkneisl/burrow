import { useState, useCallback } from "react"
import { View, Pressable, KeyboardAvoidingView, Platform, FlatList } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { useAtom } from "jotai"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import Toast from "react-native-toast-message"
import { X, ChevronLeft } from "lucide-react-native"
import { Card, Modal, Text } from "@components/core"
import ThemedIcon from "@components/core/ThemedIcon"
import { createClubModalOpen } from "@features/layout/layout.atom"
import { createClub } from "@features/clubs/clubs.api"
import {
    CreateClubFormState,
    initialFormState
} from "@features/clubs/club.types"
import { useThemeColors } from "@api/theme/useThemeColors"
import useFormState from "@api/useFormState"
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

    const { formState, errors, setErrors, updateField, verify, reset } =
        useFormState<CreateClubFormState>({
            initial: initialFormState,
            initialErrors: [] as string[],
            verifyEndpoint: "/clubs/verify"
        })

    const [currentStep, setCurrentStep] = useState(1)

    const totalSteps = 2

    // validate current step via server
    const validateCurrentStep = useCallback(async (): Promise<boolean> => {
        if (currentStep === 1) {
            return await verify({
                name: formState.name,
                displayName: formState.displayName,
                description: formState.description
            })
        }

        return true
    }, [
        currentStep,
        formState.name,
        formState.displayName,
        formState.description,
        verify
    ])

    // when the club is created
    const createClubMutation = useMutation({
        mutationFn: async () => {
            return await createClub({
                name: formState.name.trim(),
                displayName: formState.displayName.trim(),
                description: formState.description.trim(),
                links: formState.links,
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
            if (Array.isArray(error)) {
                setErrors(error as string[])
            } else {
                setErrors([error?.message || error || "Please try again"])
            }
        }
    })

    // handle next step
    const handleNext = useCallback(async () => {
        if (!(await validateCurrentStep())) return
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1)
            setErrors([])
        }
    }, [currentStep, validateCurrentStep, totalSteps, setErrors])

    // handle go back step
    const handleBack = useCallback(() => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
            setErrors([])
        }
    }, [currentStep, setErrors])

    // handle submit
    const handleSubmit = useCallback(async () => {
        if (!(await validateCurrentStep())) return
        createClubMutation.mutate()
    }, [validateCurrentStep, createClubMutation])

    // handle close
    const handleClose = useCallback(() => {
        setOpen(false)
        reset()
        setCurrentStep(1)
    }, [setOpen, reset])

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

                {/* Server errors */}
                {errors.length > 0 && (
                    <Card
                        variant="bordered"
                        className="mx-6"
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
                            errors={{}}
                        />
                    ) : (
                        <ClubPrivacyStep
                            updateField={updateField}
                            formState={formState}
                            errors={{}}
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
