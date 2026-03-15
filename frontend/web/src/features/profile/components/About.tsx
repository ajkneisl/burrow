import {
    AutocompleteInput,
    Card,
    Input,
    TextArea,
    type AutocompleteOption
} from "@umnburrow/core"
import type { Profile } from "@features/profile/profile.model.ts"
import type { User } from "@features/auth/user.types.ts"
import { useAtom } from "jotai"
import { useMemo } from "react"
import {
    isEditingProfile,
    profileEdits
} from "@features/profile/profile.atom.ts"
import { Link } from "react-router"
import { BookOpen, Calendar, GraduationCap, School } from "lucide-react"
import { convertGraduationYear } from "@api/util.ts"
import { majorInfo, type SchoolInfo } from "@features/profile/schools.ts"
import Contact from "./Contact.tsx"
import ProfileInfoRow from "./ProfileInfoRow.tsx"

type AboutProps = {
    user: User
    profile: Profile
    isTa?: boolean
}

export default function AboutView({ user, profile, isTa }: AboutProps) {
    const [isEditing] = useAtom(isEditingProfile)
    const [edits, setEdits] = useAtom(profileEdits)

    const schoolOptions: AutocompleteOption<SchoolInfo>[] = useMemo(
        () =>
            majorInfo.map((school) => ({
                label: school.name,
                value: school
            })),
        []
    )

    const filterSchools = (
        options: AutocompleteOption<SchoolInfo>[],
        input: string
    ) => {
        const search = input.toLowerCase()
        return options.filter(
            (opt) =>
                opt.value.name.toLowerCase().includes(search) ||
                opt.value.shorthand.toLowerCase().includes(search)
        )
    }

    const majorOptions: AutocompleteOption[] = useMemo(() => {
        const selectedSchool = majorInfo.find(
            (s) => s.name === edits.school || s.shorthand === edits.school
        )

        if (!selectedSchool) {
            return majorInfo.flatMap((s) =>
                s.majors.map((m) => ({ label: m, value: m }))
            )
        }
        return selectedSchool.majors.map((m) => ({ label: m, value: m }))
    }, [edits.school])

    const hasInfo =
        profile.school ||
        profile.major ||
        profile.gradYear !== null ||
        (profile.classes && profile.classes.length > 0)

    if (isEditing) {
        return (
            <div className="flex flex-col gap-4">
                <Card title="About">
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
                            placeholder="Tell others a bit about you..."
                            rows={4}
                        />
                    </form>
                </Card>

                <Card title="Info">
                    <form className="mt-3 space-y-4">
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

                        <AutocompleteInput
                            text={"School"}
                            value={edits.school}
                            options={schoolOptions}
                            filterOptions={filterSchools}
                            onSelect={(option) =>
                                setEdits((prev) => ({
                                    ...prev,
                                    school: option.value.name,
                                    major: ""
                                }))
                            }
                            renderOption={(option) => (
                                <div className="flex items-center justify-between">
                                    <span>{option.value.name}</span>
                                    <span className="text-text/50 text-xs">
                                        {option.value.shorthand}
                                    </span>
                                </div>
                            )}
                            placeholder="Search by name or shorthand (CSE, CLA...)"
                            remark="Type the school name or shorthand to search"
                        />

                        <AutocompleteInput
                            text={"Major"}
                            value={edits.major}
                            options={majorOptions}
                            onSelect={(option) =>
                                setEdits((prev) => ({
                                    ...prev,
                                    major: option.value
                                }))
                            }
                            placeholder="Computer Science"
                            remark={
                                edits.school
                                    ? `Showing majors for ${edits.school}`
                                    : "Select a school first to filter majors"
                            }
                        />
                    </form>
                </Card>

                <Contact user={user} profile={profile} />
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            {/* about */}
            <Card>
                <div className="flex flex-row items-center justify-between">
                    <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-text/50 text-sm font-semibold">About</h3>
                    </div>
                </div>

                <p className="text-text mt-1 text-sm">
                    {profile.bio || "No bio provided."}
                </p>

                {isTa && (
                    <p className="text-text/50 mt-4 text-xs">
                        This user is a TA.{" "}
                        <Link to="/ta" className="underline">
                            Learn more about what this means.
                        </Link>
                    </p>
                )}
            </Card>

            {/* info */}
            {hasInfo && (
                <Card title="Info">
                    <div className="mt-2 flex flex-col gap-3">
                        {profile.school && (
                            <ProfileInfoRow
                                icon={<School className="h-4 w-4" />}
                                label="School"
                                value={profile.school}
                            />
                        )}

                        {profile.major && (
                            <ProfileInfoRow
                                icon={<GraduationCap className="h-4 w-4" />}
                                label="Major"
                                value={profile.major}
                            />
                        )}

                        {profile.gradYear !== null && (
                            <ProfileInfoRow
                                icon={<Calendar className="h-4 w-4" />}
                                label="Year"
                                value={convertGraduationYear(profile.gradYear)}
                            />
                        )}

                        {profile.classes && profile.classes.length > 0 && (
                            <ProfileInfoRow
                                icon={<BookOpen className="h-4 w-4" />}
                                label="Classes"
                                value={
                                    <div className="flex flex-wrap gap-1.5">
                                        {profile.classes.map((cls) => (
                                            <Link
                                                key={cls}
                                                target="_blank"
                                                to={`https://umn.lol/class/${cls}`}
                                                className="hover:text-text/70 bg-card rounded-md py-0.5 font-mono text-xs underline"
                                            >
                                                {cls}
                                            </Link>
                                        ))}
                                    </div>
                                }
                            />
                        )}
                    </div>
                </Card>
            )}

            {/* contact */}
            <Contact user={user} profile={profile} />
        </div>
    )
}
