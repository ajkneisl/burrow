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

    const [currentStep, setCurrentStep] = useState(1)
    const [formState, setFormState] = useState<SubmittedBurrowFormState>({
        ...initialFormState,
        kind: burrowKind,
        ...initialData
    })
    const [errors, setErrors] = useState<Record<string, string>>({})

    // errors from backend
    const [submissionErrors, setSubmissionErrors] = useState<string[]>([])

    const isProjectBurrow = burrowKind === "PROJECT"
    const totalSteps = 3
    const isEditMode = mode === "update"

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
                setSubmissionErrors(error)
            }
        }
    })

    // update a field
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

    // validate the step
    const validateCurrentStep = useCallback((): boolean => {
        const nextErrors: Record<string, string> = {}

        if (isProjectBurrow) {
            if (currentStep === 1) {
                const name = formState.name.trim()

                if (!name) nextErrors.name = "Required"

                // name len 1<=x<=64
                if (name.length === 0 || name.length > 64)
                    nextErrors.name = "Name must be between 1 and 64 characters"

                const objective = formState.objective.trim()

                if (!objective) nextErrors.objective = "Required"

                // objective 1<=x<=256
                if (objective.length === 0 || objective.length > 256)
                    nextErrors.objective =
                        "Objective must be between 1 and 256 characters"

                const className = formState.className.trim()

                if (className.length !== 0 && className.length > 64)
                    nextErrors.className =
                        "Class name may not be over 64 characters"
            } else if (currentStep === 2) {
                if (formState.teamMembers.length === 0 && !isEditMode)
                    nextErrors.teamMembers = "At least 1 member required"
            } else if (currentStep === 3) {
                const dueDate = formState.dueDate

                if (!dueDate) nextErrors.dueDate = "Required"

                if (dueDate && new Date() > dueDate)
                    nextErrors.date = "Due date must be in the future"
            }
        } else {
            if (currentStep === 1) {
                const title = formState.title.trim()

                // has title
                if (!title) {
                    nextErrors.title = "Required"
                }

                // title between 1..32
                if (title.length === 0 || title.length > 32) {
                    nextErrors.title =
                        "Title must be between 2 and 32 characters"
                }

                const description = formState.description.trim()

                // if has description, must be under 256 characters
                if (description.length !== 0 && description.length > 256) {
                    nextErrors.description =
                        "Description must be empty or at most 256 characters"
                }

                const location = formState.location.trim()

                // if has location, must be under 256 characters
                if (location.length !== 0 && location.length > 64) {
                    nextErrors.location =
                        "Location must be empty or at most 64 characters"
                }

                const tags = formState.tags.split(",")
                // under 10 tags
                if (tags.length > 10) {
                    nextErrors.tags = "You must have under 10 tags"
                }

                // no long tags or 0 char tags
                if (tags.filter((tag) => tag.length > 10).length > 0) {
                    nextErrors.tags =
                        "You may not have any empty tags or tags over 10 characters"
                }

                const capacity = formState.capacity

                // capacity over 100
                if (capacity > 100) {
                    nextErrors.capacity = "Capacity must be less than 100"
                }

                // capacity cannot be 1 or 2
                if (capacity <= 2 && capacity !== 0) {
                    nextErrors.capacity = "Capacity must be greater than 2"
                }
            } else if (currentStep === 3) {
                const date = formState.date

                if (!date) nextErrors.date = "Required"

                // must be in future
                if (date && new Date() > date)
                    nextErrors.date = "Date must be in the future"

                const beginningTime = formState.beginningTime
                if (!beginningTime) nextErrors.beginningTime = "Required"

                const endTime = formState.endTime
                if (!endTime) nextErrors.endTime = "Required"

                // end is after beginning
                if (endTime && beginningTime && endTime < beginningTime)
                    nextErrors.endTime =
                        "End time must be after the beginning time"
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
                reoccurring: formState.reoccurring
            }

            mutation.mutate(payload)
        }
    }, [validateCurrentStep, formState, burrowKind, isProjectBurrow, mutation])

    // close
    const handleClose = () => {
        setCurrentStep(1)
        setFormState({ ...initialFormState, kind: burrowKind })
        setErrors({})
        onClose()
    }

    // get the current step
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

    // get title of step
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
                            {burrowKind === "STUDY"
                                ? "Study Group"
                                : burrowKind === "EVENT"
                                  ? "Event"
                                  : burrowKind === "CLUB"
                                    ? "Club"
                                    : "Project"}
                        </Text>

                        <Text className="text-sm text-text text-opacity-60">
                            Step {currentStep} of {totalSteps}: {getStepTitle()}
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
            <View className="flex-1">{renderStep()}</View>

            {/* handle backend errors */}
            {submissionErrors.length > 0 && (
                <Card
                    variant="bordered"
                    className="mx-6"
                    style={{
                        backgroundColor: `${colors.error}3A`
                    }}
                >
                    <Text className="font-bold mb-1">
                        There was an issue submitting your Burrow.
                    </Text>

                    <FlatList
                        data={submissionErrors}
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
