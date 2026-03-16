import type { Profile } from "@features/profile/profile.model.ts"
import { Card, Chip, Input, SelectInput } from "@umnburrow/core"
import type { User } from "@features/auth/user.types.ts"
import { useAtom } from "jotai"
import {
    isEditingProfile,
    profileEdits
} from "@features/profile/profile.atom.ts"
import { Instagram, Linkedin, Mail, Phone } from "lucide-react"

type ContactProps = {
    user: User
    profile: Profile
}

export default function Contact({ user, profile }: ContactProps) {
    const [editing] = useAtom(isEditingProfile)
    const [edits, setEdits] = useAtom(profileEdits)

    const hasContactInfo =
        user.email || profile.phoneNumber || profile.instagram || profile.linkedIn

    if (editing) {
        return (
            <Card title="Contact">
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

                    <Input
                        text={"LinkedIn"}
                        value={edits.linkedIn ?? ""}
                        onChange={(e) =>
                            setEdits((prev) => ({
                                ...prev,
                                linkedIn: e.target.value
                            }))
                        }
                        placeholder="/in/you"
                    />
                </form>
            </Card>
        )
    }

    if (!hasContactInfo) return null

    return (
        <div className="flex flex-wrap gap-2 mt-4">
            {user.email && (
                <a href={`mailto:${user.email}`}>
                    <Chip size="lg" icon={Mail}>
                        Email
                    </Chip>
                </a>
            )}

            {profile.phoneNumber && (
                <a href={`tel:${profile.phoneNumber}`}>
                    <Chip size="lg" icon={Phone}>
                        {profile.phoneNumber}
                    </Chip>
                </a>
            )}

            {profile.instagram && (
                <a
                    href={`https://instagram.com/${profile.instagram.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <Chip size="lg" icon={Instagram}>
                        Instagram
                    </Chip>
                </a>
            )}

            {profile.linkedIn && (
                <a
                    href={
                        profile.linkedIn.startsWith("http")
                            ? profile.linkedIn
                            : `https://linkedin.com/${profile.linkedIn}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <Chip size="lg" icon={Linkedin}>
                        LinkedIn
                    </Chip>
                </a>
            )}
        </div>
    )
}
