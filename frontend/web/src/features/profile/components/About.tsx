import { Card, Input, TextArea } from "@umnburrow/core"
import type { Profile } from "@features/profile/profile.model.ts"
import clsx from "clsx"
import { useAtom } from "jotai"
import {
    isEditingProfile,
    profileEdits
} from "@features/profile/profile.atom.ts"
import { Link } from "react-router"

/**
 * {@link About}
 */
type AboutProps = {
    profile: Profile
}

/**
 * The about section on the profile.
 *
 * @param profile The profile of the user.
 */
export default function About({ profile }: AboutProps) {
    const [isEditing] = useAtom(isEditingProfile)
    const [edits, setEdits] = useAtom(profileEdits)

    // regular view
    const normalView = (
        <>
            <p
                className={clsx(
                    "mt-3 leading-relaxed",
                    !profile.bio && "opacity-60 italic"
                )}
            >
                {profile.bio || "No bio provided."}
            </p>

            {/* classes */}
            <div className="mt-6">
                <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Classes</h3>
                </div>

                {profile.classes !== null && profile.classes.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                        {profile.classes.map((cls) => (
                            <span
                                key={cls}
                                className="rounded-md underline hover:text-text/70 bg-card py-1 text-sm font-mono"
                                title={cls}
                            >
                                <Link
                                    target="_blank"
                                    to={`https://umn.lol/class/${cls}`}
                                >
                                    {cls}
                                </Link>
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="mt-2 opacity-60 italic">No classes listed.</p>
                )}
            </div>
        </>
    )

    // editing view
    const editView = (
        <form className="mt-3 space-y-4">
            <Input
                text={"Name"}
                placeholder={"Your display name."}
                value={edits.name}
                onChange={(e) =>
                    setEdits((prev) => ({
                        ...prev,
                        name: e.target.value
                    }))
                }
            />

            <TextArea
                text={"Bio"}
                value={edits.bio}
                onChange={(e) =>
                    setEdits((prev) => ({
                        ...prev,
                        bio: e.target.value
                    }))
                }
                placeholder="Tell others a bit about you…"
                rows={4}
            />

            <Input
                text={"Classes"}
                value={edits.classes}
                onChange={(e) =>
                    setEdits((prev) => ({
                        ...prev,
                        classes: e.target.value
                    }))
                }
                placeholder="CSCI 2021, MATH 1271, CSCI 1933H"
                remark={"Separate your classes using commas."}
            />

            <Input
                text={"Graduation Year"}
                value={edits.gradYear}
                onChange={(e) =>
                    setEdits((prev) => ({
                        ...prev,
                        gradYear: e.target.value
                    }))
                }
                placeholder="2028"
            />
        </form>
    )

    return <Card title="About">{isEditing ? editView : normalView}</Card>
}
