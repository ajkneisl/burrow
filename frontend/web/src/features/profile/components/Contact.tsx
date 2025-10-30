import type { Profile } from "@features/profile/profile.model.ts"
import { Card, Input, SelectInput } from "@umnburrow/core"
import type { User } from "@features/auth/user.types.ts"
import { useAtom } from "jotai"
import {
    isEditingProfile,
    profileEdits
} from "@features/profile/profile.atom.ts"

/**
 * {@see Contact}
 */
type ContactProps = {
    user: User
    profile: Profile
}

/**
 * Contact information about a profile.
 *
 * @param user The user to view the contact information of.
 * @param profile The profile of {@link user}.
 */
export default function Contact({ user, profile }: ContactProps) {
    const [editing] = useAtom(isEditingProfile)
    const [edits, setEdits] = useAtom(profileEdits)

    const normalView = (
        <>
            <ul className="mt-4 space-y-3">
                {/* email */}
                <ContactRow
                    label="Email"
                    value={user.email}
                    href={user.email ? `mailto:${user.email}` : undefined}
                />

                {/* phone */}
                <ContactRow
                    label="Phone"
                    value={profile.phoneNumber ?? ""}
                    href={
                        profile.phoneNumber
                            ? `tel:${profile.phoneNumber}`
                            : undefined
                    }
                />

                {/* instagram */}
                <ContactRow
                    label="Instagram"
                    value={profile.instagram ?? ""}
                    href={
                        profile.instagram
                            ? `https://instagram.com/${profile.instagram}`
                            : undefined
                    }
                />
            </ul>
        </>
    )

    const editingView = (
        <form className="mt-3 space-y-4">
            <SelectInput
                value={edits.visibility}
                onChange={(e) =>
                    setEdits((prev) => ({
                        ...prev,
                        visibility: e.target.value
                    }))
                }
                text={"Profile Visibility"}
                items={["Public", "Friends", "Private"]}
                remark={"Who can see your profile."}
            />

            {/* phone number */}
            <Input
                text={"Phone"}
                value={edits.phoneNumber ?? ""}
                onChange={(e) =>
                    setEdits((prev) => ({
                        ...prev,
                        phoneNumber: e.target.value
                    }))
                }
                placeholder="+1 (555) 123-4567"
            />

            {/* instagram */}
            <Input
                text={"Instagram"}
                value={edits.instagram ?? ""}
                onChange={(e) =>
                    setEdits((prev) => ({
                        ...prev,
                        instagram: e.target.value
                    }))
                }
                placeholder="@you"
            />
        </form>
    )

    return <Card title="Contact">{editing ? editingView : normalView}</Card>
}

/**
 * A row of contact information.
 *
 * @param label The name of the contact.
 * @param value The type.
 * @param href When clicked on.
 */
function ContactRow({
    label,
    value,
    href
}: {
    label: string
    value?: string
    href?: string
}) {
    return (
        <li className="flex items-center justify-between gap-4">
            <span className="text-sm opacity-70">{label}</span>

            {value ? (
                href ? (
                    <a className="link" href={href}>
                        {value}
                    </a>
                ) : (
                    <span>{value}</span>
                )
            ) : (
                <span className="opacity-40">—</span>
            )}
        </li>
    )
}
