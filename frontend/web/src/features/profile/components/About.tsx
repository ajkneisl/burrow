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
                    !profile.bio && "italic opacity-60"
                )}
            >
                {profile.bio || "No bio provided."}
            </p>

            <div className="mt-6 flex flex-row justify-between gap-2">
                {/* school */}
                <div className="flex flex-col">
                    <h3 className="text-sm font-semibold">School</h3>

                    <p className="text-text/70 text-sm">
                        {profile.school ?? "Not declared."}
                    </p>
                </div>

                {/* major */}
                <div className="flex flex-col">
                    <h3 className="text-sm font-semibold">Major</h3>

                    <p className="text-text/70 text-sm">
                        {profile.major ?? "Not declared."}
                    </p>
                </div>
            </div>

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
                                className="hover:text-text/70 bg-card rounded-md py-1 font-mono text-sm underline"
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
                    <p className="mt-2 italic opacity-60">No classes listed.</p>
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

            {/* school */}
            <Input
                text={"School"}
                value={edits.school}
                onChange={(e) =>
                    setEdits((prev) => ({
                        ...prev,
                        school: e.target.value
                    }))
                }
                placeholder="School of Science and Engineering"
            />

            {/* major */}
            <Input
                text={"Major"}
                value={edits.major}
                onChange={(e) =>
                    setEdits((prev) => ({
                        ...prev,
                        major: e.target.value
                    }))
                }
                placeholder="Computer Science"
            />
        </form>
    )

    return (
        <Card title="About" className="min-w-lg">
            {isEditing ? editView : normalView}
        </Card>
    )
}
