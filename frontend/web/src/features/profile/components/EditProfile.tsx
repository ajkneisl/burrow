import { Button } from "@umnburrow/core"
import { useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useAtom } from "jotai"
import {
    isEditingProfile,
    profileEditErrors,
    profileEdits
} from "@features/profile/profile.atom.ts"
import { saveProfile } from "@features/profile/profile.api.ts"
import type { User } from "@features/auth/user.types.ts"
import type { Profile } from "@features/profile/profile.model.ts"

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

    const [, setErrors] = useAtom(profileEditErrors)
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
        setIsSubmitting(true)

        try {
            await saveProfile(edits)

            // invalidate since backend may do some fixes
            await queryClient.invalidateQueries({
                queryKey: ["profile", user.username]
            })

            setErrors([])
            setIsEditing(false)
        } catch (e: any) {
            setErrors(e as string[])
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
