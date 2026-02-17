import { useState, useCallback } from "react"
import { View, Text, Pressable, FlatList } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useRouter } from "expo-router"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import Toast from "react-native-toast-message"
import { X, ChevronLeft } from "lucide-react-native"
import { Button, Card } from "@components/core"
import type { Burrow, BurrowKind } from "@features/burrows/burrows.types"
import { createBurrow, updateBurrow } from "../burrows.api"
import { useThemeColors } from "@api/theme/useThemeColors"
import useFormState from "@api/useFormState"
import {
    initialFormState,
    type CreateStepProps,
    type SubmittedBurrowFormState,
    type SubmittedBurrow,
    type SubmittedStudyEventBurrow,
    type SubmittedProjectBurrow
} from "./create.types"
import { StudyEventInfoStep } from "./steps/StudyEventInfoStep"
import { PrivacyStep } from "./steps/PrivacyStep"
import { ScheduleStep } from "./steps/ScheduleStep"
import { ProjectInfoStep } from "./steps/ProjectInfoStep"
import { MembersStep } from "./steps/MembersStep"
import { DueDateStep } from "./steps/DueDateStep"
import { ClubSelectorStep } from "./steps/ClubSelectorStep"
import ThemedIcon from "@components/core/ThemedIcon"

/**
 * {@link CreateBurrowWizard}
 */
type CreateBurrowWizardProps = {
    onClose: () => void
    burrowKind: BurrowKind
    mode?: "create" | "update"
    burrowID?: string
    initialData?: Partial<SubmittedBurrowFormState>
}

/**
 * Wizard to create a Burrow.
 *
 * @param onClose When the modal is closed.
 * @param burrowKind The kind of Burrow to create.
 * @param mode If the user is updating an existing or creating a new Burrow.
 * @param burrowID The ID of the existing burrow if updating.
 * @param initialData The initial data if updating.
 *
 * @author AJ Kneisl
 */
export function CreateBurrowWizard({
    onClose,
    burrowKind,
    mode = "create",
    burrowID,
    initialData
}: CreateBurrowWizardProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const colors = useThemeColors()

    const isProjectBurrow = burrowKind === "PROJECT"
    const isClubBurrow = burrowKind === "CLUB" && mode !== "update"
    const totalSteps = isClubBurrow ? 4 : 3
    const isEditMode = mode === "update"

    const {
        formState,
        setFormState,
        errors: serverErrors,
        setErrors: setServerErrors,
        updateField,
        verify,
        reset
    } = useFormState<SubmittedBurrowFormState, string[]>({
        initial: {
            ...initialFormState,
            kind: burrowKind,
            ...initialData
        },
        initialErrors: [],
        verifyEndpoint: isProjectBurrow
            ? "/burrows/verify/project"
            : "/burrows/verify"
    })

    const [currentStep, setCurrentStep] = useState(1)

    const mutation = useMutation({
        mutationFn: async (payload: SubmittedBurrow) => {
            if (isEditMode && burrowID) {
                await updateBurrow(burrowID, payload)

                return { burrow: { id: burrowID } as Burrow }
            }

            return { burrow: await createBurrow(payload) }
        },

        onSuccess: async (data: { burrow: Burrow }) => {
            await queryClient.invalidateQueries({ queryKey: ["burrows"] })
            await queryClient.invalidateQueries({ queryKey: ["schedule"] })

            if (burrowID) {
                await queryClient.invalidateQueries({
                    queryKey: ["burrow", burrowID]
                })
            }

            Toast.show({
                type: "success",
                text1: isEditMode ? "Burrow updated!" : "Burrow created!",
                text2: isEditMode
                    ? `Your ${burrowKind.toLowerCase()} Burrow has been updated.`
                    : `Your ${burrowKind.toLowerCase()} Burrow has been created.`
            })

            handleClose()

            if (!isEditMode && data?.burrow?.id) {
                router.push(`/burrow/${data.burrow.id}`)
            }
        },

        onError: (error: any) => {
            Toast.show({
                type: "error",
                text1: isEditMode
                    ? "Failed to update Burrow"
                    : "Failed to create Burrow",
                text2: error.message || "Please try again"
            })

            if (Array.isArray(error)) {
                setServerErrors(error)
            }
        }
    })

    // For club burrows, the actual step content is offset by 1 (step 1 = club select)
    const contentStep = isClubBurrow ? currentStep - 1 : currentStep

    // validate current step via server
    const validateCurrentStep = useCallback(async (): Promise<boolean> => {
        // Club selector step stays client-side (no verify endpoint for club selection)
        if (isClubBurrow && currentStep === 1) {
            if (!formState.clubID) {
                setServerErrors(["Please select a club."])
                return false
            }
            return true
        }

        if (isProjectBurrow) {
            if (currentStep === 1) {
                return await verify({
                    name: formState.name,
                    objective: formState.objective,
                    className: formState.className
                })
            } else if (currentStep === 2) {
                if (formState.teamMembers.length === 0 && !isEditMode) {
                    setServerErrors(["At least 1 team member is required."])
                    return false
                }
                return true
            } else if (currentStep === 3) {
                if (!formState.dueDate) {
                    setServerErrors(["Due date is required."])
                    return false
                }
                return await verify({
                    dueDate: formState.dueDate.getTime()
                })
            }
        } else {
            if (contentStep === 1) {
                return await verify({
                    title: formState.title,
                    description: formState.description,
                    location: formState.location
                })
            } else if (contentStep === 3) {
                if (
                    !formState.date ||
                    !formState.beginningTime ||
                    !formState.endTime
                ) {
                    setServerErrors(["Date and times are required."])
                    return false
                }

                const date = formState.date
                const beginDateTime = new Date(date)
                beginDateTime.setHours(
                    formState.beginningTime.getHours(),
                    formState.beginningTime.getMinutes(),
                    0,
                    0
                )

                const endDateTime = new Date(date)
                endDateTime.setHours(
                    formState.endTime.getHours(),
                    formState.endTime.getMinutes(),
                    0,
                    0
                )

                return await verify({
                    beginningTime: beginDateTime.getTime(),
                    endTime: endDateTime.getTime()
                })
            }
        }

        return true
    }, [
        currentStep,
        contentStep,
        formState,
        isProjectBurrow,
        isClubBurrow,
        isEditMode,
        verify,
        setServerErrors
    ])

    const handleNext = useCallback(async () => {
        if (!(await validateCurrentStep())) return

        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1)
            setServerErrors([])
        }
    }, [currentStep, validateCurrentStep, totalSteps, setServerErrors])

    const handleBack = useCallback(() => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
            setServerErrors([])
        }
    }, [currentStep, setServerErrors])

    const handleSubmit = useCallback(async () => {
        if (!(await validateCurrentStep())) return

        if (isProjectBurrow) {
            if (!formState.dueDate) return

            const payload: SubmittedProjectBurrow = {
                kind: "PROJECT",
                name: formState.name.trim(),
                objective: formState.objective.trim(),
                className: formState.className.trim() || "",
                teamMembers: formState.teamMembers,
                dueDate: formState.dueDate.getTime()
            }

            mutation.mutate(payload)
        } else {
            if (
                !formState.date ||
                !formState.beginningTime ||
                !formState.endTime
            )
                return

            const beginDateTime = new Date(formState.date)
            beginDateTime.setHours(
                formState.beginningTime.getHours(),
                formState.beginningTime.getMinutes(),
                0,
                0
            )

            const endDateTime = new Date(formState.date)
            endDateTime.setHours(
                formState.endTime.getHours(),
                formState.endTime.getMinutes(),
                0,
                0
            )

            const payload: SubmittedStudyEventBurrow = {
                kind: burrowKind as "STUDY" | "EVENT" | "CLUB",
                title: formState.title.trim(),
                description: formState.description.trim(),
                location: formState.location.trim(),
                beginningTime: beginDateTime.getTime(),
                endTime: endDateTime.getTime(),
                tags: formState.tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                capacity: formState.capacity,
                visibility: formState.visibility,
                requestToJoin: formState.requestToJoin,
                reoccurring: formState.reoccurring,
                ...(formState.clubID ? { clubID: formState.clubID } : {})
            }

            mutation.mutate(payload)
        }
    }, [validateCurrentStep, formState, burrowKind, isProjectBurrow, mutation])

    // close
    const handleClose = () => {
        setCurrentStep(1)
        reset()
        setFormState({ ...initialFormState, kind: burrowKind })
        onClose()
    }

    const steps: {
        title: string
        component: React.ComponentType<CreateStepProps>
    }[] = isProjectBurrow
        ? [
              { title: "Project Details", component: ProjectInfoStep },
              { title: "Team Members", component: MembersStep },
              { title: "Due Date", component: DueDateStep }
          ]
        : isClubBurrow
          ? [
                { title: "Select Club", component: ClubSelectorStep },
                { title: "Basic Info", component: StudyEventInfoStep },
                { title: "Privacy", component: PrivacyStep },
                { title: "Schedule", component: ScheduleStep }
            ]
          : [
                { title: "Basic Info", component: StudyEventInfoStep },
                { title: "Privacy", component: PrivacyStep },
                { title: "Schedule", component: ScheduleStep }
            ]

    const currentStepConfig = steps[currentStep - 1]
    const StepComponent = currentStepConfig?.component
    const stepTitle = currentStepConfig?.title ?? ""

    return (
        <SafeAreaView className="flex-1 bg-background">
            {/* header */}
            <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
                <View className="flex-row items-center">
                    {currentStep > 1 && (
                        <Pressable onPress={handleBack} className="mr-3">
                            <ChevronLeft size={24} color={colors.text} />
                        </Pressable>
                    )}

                    <View>
                        <Text className="text-xl font-bold text-text">
                            {isEditMode ? "Edit" : "Create"}{" "}
                            {
                                {
                                    STUDY: "Study Group",
                                    EVENT: "Event",
                                    CLUB: "Club",
                                    PROJECT: "Project"
                                }[burrowKind]
                            }
                        </Text>

                        <Text className="text-sm text-text text-opacity-60">
                            Step {currentStep} of {totalSteps}: {stepTitle}
                        </Text>
                    </View>
                </View>

                <Pressable onPress={handleClose}>
                    <ThemedIcon icon={X} size={24} />
                </Pressable>
            </View>

            {/* page indicator */}
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

            {/* step */}
            <View className="flex-1">
                {StepComponent && (
                    <StepComponent
                        errors={{}}
                        formState={formState}
                        updateField={updateField}
                        isEditMode={isEditMode}
                    />
                )}
            </View>

            {/* handle server errors */}
            {serverErrors.length > 0 && (
                <Card
                    variant="bordered"
                    className="mx-6"
                    style={{
                        backgroundColor: `${colors.error}3A`
                    }}
                >
                    <Text className="font-bold mb-1">
                        There was an issue with your input.
                    </Text>

                    <FlatList
                        data={serverErrors}
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

            {/* cancel / next */}
            <View className="px-6 py-4 border-t border-gray-200 flex-row gap-3">
                <Button
                    variant="danger"
                    onPress={handleClose}
                    className="flex-1"
                    disabled={mutation.isPending}
                >
                    Cancel
                </Button>

                {currentStep < totalSteps ? (
                    <Button
                        variant="success"
                        onPress={handleNext}
                        className="flex-1"
                    >
                        Next
                    </Button>
                ) : (
                    <Button
                        variant="success"
                        onPress={handleSubmit}
                        className="flex-1"
                        loading={mutation.isPending}
                    >
                        {isEditMode ? "Save" : "Create"}
                    </Button>
                )}
            </View>
        </SafeAreaView>
    )
}
