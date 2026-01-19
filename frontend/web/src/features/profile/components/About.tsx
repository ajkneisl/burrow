import {
    AutocompleteInput,
    Card,
    Input,
    TextArea,
    type AutocompleteOption
} from "@umnburrow/core"
import type { Profile } from "@features/profile/profile.model.ts"
import clsx from "clsx"
import { useAtom } from "jotai"
import { useMemo } from "react"
import {
    isEditingProfile,
    profileEdits
} from "@features/profile/profile.atom.ts"
import { Link } from "react-router"

type SchoolInfo = {
    name: string
    shorthand: string
    majors: string[]
}

const majorInfo: SchoolInfo[] = [
    {
        "name": "Undecided",
        "shorthand": "UND",
        "majors": [
            "Undecided"
        ]
    },
    {
        "name": "College of Science and Engineering",
        "shorthand": "CSE",
        "majors": [
            "Aerospace Engineering and Mechanics",
            "Astrophysics",
            "Biomedical Engineering",
            "Bioproducts and Biosystems Engineering",
            "Chemical Engineering",
            "Chemistry",
            "Civil Engineering",
            "Computer Engineering",
            "Computer Science",
            "Data Science",
            "Earth Sciences",
            "Electrical Engineering",
            "Environmental Engineering",
            "Environmental Geosciences",
            "Geoengineering",
            "Industrial and Systems Engineering",
            "Materials Science and Engineering",
            "Mathematics",
            "Mechanical Engineering",
            "Physics",
            "Statistical Practice",
            "Statistical Science"
        ]
    },
    {
        "name": "College of Biological Sciences",
        "shorthand": "CBS",
        "majors": [
            "Biochemistry",
            "Biology",
            "Biology, Society, and Environment",
            "Ecology, Evolution, and Behavior",
            "Genetics, Cell Biology, and Development",
            "Microbiology",
            "Neuroscience",
            "Plant and Microbial Biology"
        ]
    },
    {
        "name": "Carlson School of Management",
        "shorthand": "CSOM",
        "majors": [
            "Accounting",
            "Business Analytics",
            "Entrepreneurial Management",
            "Finance",
            "Finance & Risk Management Insurance",
            "Human Resources and Industrial Relations",
            "International Business",
            "Management Information Systems",
            "Marketing",
            "Supply Chain & Operations Management"
        ]
    },
    {
        "name": "College of Liberal Arts",
        "shorthand": "CLA",
        "majors": [
            "Acting",
            "African American and African Studies",
            "American Indian Studies",
            "American Studies",
            "Anthropology",
            "Art",
            "Art History",
            "Asian and Middle Eastern Studies",
            "Astrophysics",
            "Chemistry",
            "Chicano-Latino Studies",
            "Classical and Near Eastern Religions and Cultures",
            "Communication Studies",
            "Cultural Studies and Comparative Literature",
            "Dakota Language",
            "Dance",
            "Developmental Psychology",
            "Earth Sciences",
            "English",
            "Environmental Geosciences",
            "French and Italian Studies",
            "French Studies",
            "Gender, Women and Sexuality Studies",
            "Geography",
            "German, Scandinavian, Dutch",
            "Global Studies",
            "History",
            "Italian Studies",
            "Jewish Studies",
            "Journalism",
            "Linguistics",
            "Mathematics",
            "Media and Information",
            "Music",
            "Ojibwe Language",
            "Philosophy",
            "Physics",
            "Political Science",
            "Psychology",
            "Religious Studies",
            "Russian",
            "Sociology",
            "Sociology of Law, Criminology, and Justice",
            "Spanish and Portuguese Studies",
            "Spanish Studies",
            "Speech-Language-Hearing Sciences",
            "Strategic Communication: Advertising and Public Relations",
            "Studies in Cinema and Media Culture",
            "Theatre Arts",
            "Urban Studies"
        ]
    },
    {
        "name": "College of Food, Agricultural and Natural Resource Sciences",
        "shorthand": "CFANS",
        "majors": [
            "Agricultural and Food Business Management",
            "Agricultural Communication and Marketing",
            "Agricultural Education",
            "Animal Science",
            "Applied Economics",
            "Environmental Sciences, Policy and Management",
            "Fisheries, Wildlife, and Conservation Biology",
            "Food Science",
            "Forest and Natural Resource Management",
            "Nutrition",
            "Plant Science",
            "Sustainable Agriculture and Food Systems"
        ]
    },
    {
        "name": "College of Design",
        "shorthand": "CDes",
        "majors": [
            "Apparel Design",
            "Architecture",
            "Graphic Design",
            "Interior Design",
            "Landscape Architecture",
            "Product Design",
            "User Experience (UX) Design"
        ]
    },
    {
        "name": "College of Education and Human Development",
        "shorthand": "CEHD",
        "majors": [
            "Business and Marketing Education",
            "Early Childhood",
            "Elementary Education: Foundations",
            "Family Social Science",
            "Human Resource Development",
            "Kinesiology",
            "Music Education",
            "Music Therapy",
            "Physical Activity and Health Promotion",
            "Special Education",
            "Sport Management",
            "Youth Studies"
        ]
    },
    {
        "name": "School of Public Health",
        "shorthand": "SPH",
        "majors": [
            "Public Health"
        ]
    },
    {
        "name": "School of Nursing",
        "shorthand": "SoN",
        "majors": [
            "Nursing"
        ]
    },
    {
        "name": "College of Continuing and Professional Studies",
        "shorthand": "CCAPS",
        "majors": [
            "Bachelor of Individualized Studies",
            "Multidisciplinary Studies"
        ]
    },
    {
        "name": "School of Dentistry",
        "shorthand": "SoD",
        "majors": [
            "Dental Hygiene"
        ]
    },
    {
        "name": "School of Public Affairs",
        "shorthand": "HHH",
        "majors": [
            "Public & Nonprofit Management"
        ]
    },
    {
        "name": "Multiple Colleges/Cross-College Programs",
        "shorthand": "Cross",
        "majors": [
            "Construction Management",
            "Healthcare Management",
            "Human Physiology",
            "Individually Designed Interdepartmental Major",
            "Information Technology Infrastructure",
            "Inter-College Program",
            "Medical Laboratory Sciences",
            "Mortuary Science",
            "Cellular and Organismal Physiology",
            "Retail and Consumer Studies",
            "Sustainable Systems Management",
            "Technical Writing and Communication",
            "Health and Wellbeing Sciences"
        ]
    }
]

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
export default function AboutView({ profile }: AboutProps) {
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

    // get majors for the currently selected school
    const majorOptions: AutocompleteOption[] = useMemo(() => {
        const selectedSchool = majorInfo.find(
            (s) => s.name === edits.school || s.shorthand === edits.school
        )

        // show all majors otherwise
        if (!selectedSchool) {
            return majorInfo.flatMap((s) =>
                s.majors.map((m) => ({ label: m, value: m }))
            )
        }
        return selectedSchool.majors.map((m) => ({ label: m, value: m }))
    }, [edits.school])

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
            <AutocompleteInput
                text={"School"}
                value={edits.school}
                options={schoolOptions}
                filterOptions={filterSchools}
                onSelect={(option) =>
                    setEdits((prev) => ({
                        ...prev,
                        school: option.value.name,
                        // Clear major when school changes
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

            {/* major */}
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
    )

    return (
        <Card title="About" className="lg:min-w-lg">
            {isEditing ? editView : normalView}
        </Card>
    )
}
