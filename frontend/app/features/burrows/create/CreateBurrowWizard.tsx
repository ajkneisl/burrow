import { useState, useCallback } from "react"
import { View, Text, Pressable, SafeAreaView } from "react-native"
import { useRouter } from "expo-router"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import Toast from "react-native-toast-message"
import { X, ChevronLeft } from "lucide-react-native"
import { Button } from "@components/core"
import type { BurrowType, Burrow } from "@features/burrows/burrows.types"
import { createBurrow, updateBurrow } from "../burrows.api"
import { useThemeColors } from "@api/theme/useThemeColors"
import {
    initialFormState,
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

type CreateBurrowWizardProps = {
    onClose: () => void
    burrowType: BurrowType
    mode?: "create" | "update"
    burrowId?: string
    initialData?: Partial<SubmittedBurrowFormState>
}

export function CreateBurrowWizard({
    onClose,
    burrowType,
    mode = "create",
    burrowId,
    initialData
}: CreateBurrowWizardProps) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const colors = useThemeColors()

    const [currentStep, setCurrentStep] = useState(1)
    const [formState, setFormState] = useState<SubmittedBurrowFormState>({
        ...initialFormState,
        kind: burrowType,
        ...initialData
    })
    const [errors, setErrors] = useState<Record<string, string>>({})

    const isProjectBurrow = burrowType === "PROJECT"
    const totalSteps = 3
    const isEditMode = mode === "update"

    const mutation = useMutation({
        mutationFn: async (payload: SubmittedBurrow) => {
            if (isEditMode && burrowId) {
                await updateBurrow(burrowId, payload)
                return { burrow: { id: burrowId } as Burrow }
            }
            return await createBurrow(payload)
        },
        onSuccess: (data: { burrow: Burrow }) => {
            queryClient.invalidateQueries({ queryKey: ["burrows"] })
            queryClient.invalidateQueries({ queryKey: ["schedule"] })
            if (burrowId) {
                queryClient.invalidateQueries({ queryKey: ["burrow", burrowId] })
            }

            Toast.show({
                type: "success",
                text1: isEditMode ? "Burrow updated!" : "Burrow created!",
                text2: isEditMode
                    ? `Your ${burrowType.toLowerCase()} Burrow has been updated.`
                    : `Your ${burrowType.toLowerCase()} Burrow has been created.`
            })

            handleClose()

            if (!isEditMode && data?.burrow?.id) {
                router.push(`/burrow/${data.burrow.id}`)
            }
        },
        onError: (error: any) => {
            if (Array.isArray(error)) {
                const fieldErrors: Record<string, string> = {}
                error.forEach((msg: string) => {
                    const match = msg.match(
                        /^\s*([A-Za-z][\w.-]*)\s*[:=-]\s*(.+)$/
                    )
                    if (match) {
                        fieldErrors[match[1]] = match[2]
                    }
                })
                if (Object.keys(fieldErrors).length > 0) {
                    setErrors(fieldErrors)
                }
            }
            Toast.show({
                type: "error",
                text1: isEditMode
                    ? "Failed to update burrow"
                    : "Failed to create burrow",
                text2: error.message || "Please try again"
            })
        }
    })

    const updateField = useCallback(
        <K extends keyof SubmittedBurrowFormState>(
            field: K,
            value: SubmittedBurrowFormState[K]
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

    const validateCurrentStep = useCallback((): boolean => {
        const nextErrors: Record<string, string> = {}

        if (isProjectBurrow) {
            if (currentStep === 1) {
                if (!formState.name.trim()) nextErrors.name = "Required"
                if (!formState.objective.trim())
                    nextErrors.objective = "Required"
            } else if (currentStep === 2) {
                if (formState.teamMembers.length === 0 && !isEditMode)
                    nextErrors.teamMembers = "At least 1 member required"
            } else if (currentStep === 3) {
                if (!formState.dueDate) nextErrors.dueDate = "Required"
            }
        } else {
            if (currentStep === 1) {
                if (!formState.title.trim()) nextErrors.title = "Required"
                if (!formState.location.trim()) nextErrors.location = "Required"
            } else if (currentStep === 3) {
                if (!formState.date) nextErrors.date = "Required"
                if (!formState.beginningTime)
                    nextErrors.beginningTime = "Required"
                if (!formState.endTime) nextErrors.endTime = "Required"

                if (formState.beginningTime && formState.endTime) {
                    if (formState.beginningTime >= formState.endTime) {
                        nextErrors.endTime = "End time must be after start time"
                    }
                }
            }
        }

        setErrors(nextErrors)
        return Object.keys(nextErrors).length === 0
    }, [currentStep, formState, isProjectBurrow])

    const handleNext = useCallback(() => {
        if (!validateCurrentStep()) return

        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1)
            setErrors({})
        }
    }, [currentStep, validateCurrentStep, totalSteps])

    const handleBack = useCallback(() => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1)
            setErrors({})
        }
    }, [currentStep])

    const handleSubmit = useCallback(async () => {
        if (!validateCurrentStep()) return

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
                kind: burrowType as "STUDY" | "EVENT" | "CLUB",
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
                requestToJoin: formState.requestToJoin
            }

            mutation.mutate(payload)
        }
    }, [
        validateCurrentStep,
        formState,
        burrowType,
        isProjectBurrow,
        mutation
    ])

    const handleClose = () => {
        setCurrentStep(1)
        setFormState({ ...initialFormState, kind: burrowType })
        setErrors({})
        onClose()
    }

    const renderStep = () => {
        const stepProps = {
            errors,
            formState,
            updateField,
            isEditMode
        }

        if (isProjectBurrow) {
            switch (currentStep) {
                case 1:
                    return <ProjectInfoStep {...stepProps} />
                case 2:
                    return <MembersStep {...stepProps} />
                case 3:
                    return <DueDateStep {...stepProps} />
                default:
                    return null
            }
        } else {
            switch (currentStep) {
                case 1:
                    return <StudyEventInfoStep {...stepProps} />
                case 2:
                    return <PrivacyStep {...stepProps} />
                case 3:
                    return <ScheduleStep {...stepProps} />
                default:
                    return null
            }
        }
    }

    const getStepTitle = () => {
        if (isProjectBurrow) {
            switch (currentStep) {
                case 1:
                    return "Project Details"
                case 2:
                    return "Team Members"
                case 3:
                    return "Due Date"
                default:
                    return ""
            }
        } else {
            switch (currentStep) {
                case 1:
                    return "Basic Info"
                case 2:
                    return "Privacy"
                case 3:
                    return "Schedule"
                default:
                    return ""
            }
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-background">
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
                            {burrowType === "STUDY"
                                ? "Study Group"
                                : burrowType === "EVENT"
                                  ? "Event"
                                  : burrowType === "CLUB"
                                    ? "Club"
                                    : "Project"}
                        </Text>
                        <Text className="text-sm text-text text-opacity-60">
                            Step {currentStep} of {totalSteps}: {getStepTitle()}
                        </Text>
                    </View>
                </View>

                <Pressable onPress={handleClose}>
                    <X size={24} color={colors.text} />
                </Pressable>
            </View>

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

            <View className="flex-1">{renderStep()}</View>

            <View className="px-6 py-4 border-t border-gray-200 flex-row gap-3">
                <Button
                    variant="outline"
                    onPress={handleClose}
                    className="flex-1"
                    disabled={mutation.isPending}
                >
                    Cancel
                </Button>

                {currentStep < totalSteps ? (
                    <Button
                        variant="primary"
                        onPress={handleNext}
                        className="flex-1"
                    >
                        Next
                    </Button>
                ) : (
                    <Button
                        variant="primary"
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
