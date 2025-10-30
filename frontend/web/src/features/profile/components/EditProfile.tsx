import { Button } from "@umnburrow/core"
import { useQueryClient } from "@tanstack/react-query"
import useToken from "@features/auth/hooks/useToken.ts"
import { useState } from "react"
import { useAtom } from "jotai"
import {
    isEditingProfile,
    profileEdits
} from "@features/profile/profile.atom.ts"
import { saveProfile } from "@features/profile/profile.api.ts"
import type { User } from "@features/auth/user.types.ts"
import type { Profile, UserResponse } from "@features/profile/profile.model.ts"
import toast from "react-hot-toast"

/**
 * {@see EditProfile}
 */
type EditProfileProps = {
    user: User
    profile: Profile
}

/**
 * The button to start editing a profile.
 *
 * @param user The user to start editing for.
 * @param profile The profile of the {@link user}.
 * @constructor
 */
export default function EditProfile({ user, profile }: EditProfileProps) {
    const queryClient = useQueryClient()
    const auth = useToken()

    const [edits, setEdits] = useAtom(profileEdits)
    const [isEditing, setIsEditing] = useAtom(isEditingProfile)

    const [isSubmitting, setIsSubmitting] = useState(false)

    async function toggleEditing() {
        if (isEditing) {
            setIsSubmitting(true)

            await saveProfileEdits()

            setIsSubmitting(false)
        } else {
            const normalized: Record<keyof Profile, string> = (
                Object.keys(profile) as Array<keyof Profile>
            ).reduce(
                (acc, key) => {
                    const value = profile[key] as unknown

                    if (key === "classes") {
                        acc[key] = Array.isArray(value)
                            ? (value as string[]).join(", ")
                            : ""
                    } else if (value === null || value === undefined) {
                        acc[key] = ""
                    } else {
                        acc[key] = String(value)
                    }
                    return acc
                },
                {} as Record<keyof Profile, string>
            )

            setEdits(normalized)
            setIsEditing(true)
        }
    }

    async function saveProfileEdits() {
        if (auth === null) return
        setIsSubmitting(true)

        try {
            await saveProfile(auth, edits)

            queryClient.setQueryData(
                ["profile", user.username],
                (prev: UserResponse) => {
                    if (!prev) return prev
                    return {
                        ...prev,
                        profile: {
                            ...prev.profile,
                            ...edits,
                            gradYear: edits.gradYear
                                ? parseInt(edits.gradYear)
                                : null,
                            classes: edits.classes
                                ? edits.classes
                                      .split(",")
                                      .map((s) => s.trim())
                                      .filter((s) => s.length > 0)
                                : []
                        }
                    }
                }
            )

            setIsEditing(false)
        } catch (e) {
            toast.error(e as string)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Button
            aria-label="Edit profile"
            color={isEditing ? "SECONDARY" : "PRIMARY"}
            onClick={toggleEditing}
            loading={isSubmitting}
        >
            {isEditing ? "Save Profile" : "Edit Profile"}
        </Button>
    )
}
