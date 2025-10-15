import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { updateUser } from "@features/auth/api/user.api.ts"
import useToken from "@features/auth/api/hooks/useToken.ts"
import useUser from "@features/auth/api/hooks/useUser.ts"
import LabelledInput from "@components/LabelledInput.tsx"
import Button from "@components/Button.tsx"
import { useAtom } from "jotai"
import { themeAtom } from "@api/theme.atom.ts"
import Card from "@components/Card.tsx"

/**
 * User settings page.
 */
export default function Settings() {
    const auth = useToken()
    const user = useUser()

    const nav = useNavigate()

    const [, setTheme] = useAtom(themeAtom)

    // State for editable fields
    const [name, setName] = useState<string>("")
    const [phoneNumber, setPhoneNumber] = useState<string>("")
    const [errors, setErrors] = useState<string[]>([])

    // submit the stuff
    async function onSubmit() {
        if (!user) return

        const nextErrors: string[] = []
        setErrors([])

        // Basic client-side validation (optional, keep minimal)
        if (name.trim().length === 0) {
            nextErrors.push("Name cannot be empty.")
        }

        try {
            if (nextErrors.length === 0 && auth != null) {
                // if number has been changed
                if (phoneNumber !== user.phoneNumber) {
                    await updateUser(auth, "phone", phoneNumber)
                }

                // if name has been changed
                if (name !== user.name) {
                    await updateUser(auth, "name", name)
                }
            }
        } catch (e: any) {
            nextErrors.push(e?.message || "Failed to save settings.")
        } finally {
            if (nextErrors.length > 0) setErrors(nextErrors)
        }
    }

    useEffect(() => {
        if (user) {
            setName(user.name ?? "")
            setPhoneNumber(user.phoneNumber ?? "")
        }
    }, [user])

    if (auth === "") {
        nav("/welcome")
        return <></>
    }

    if (user == null) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-gray-500">Loading...</div>
            </div>
        )
    }

    return (
        <div className="mx-auto w-full">
            <div className="mb-3 flex items-center justify-between">
                <h2 className="text-2xl figtree mt-8">Settings</h2>
            </div>

            {/* errors provided by backend */}
            {errors.length > 0 && (
                <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800">
                    <p className="font-medium mb-1">
                        Please fix the following:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                        {errors.map((err, i) => (
                            <li key={i}>{err}</li>
                        ))}
                    </ul>
                </div>
            )}

            <form
                className="space-y-8"
                onSubmit={async (e) => {
                    e.preventDefault()
                    await onSubmit()
                }}
            >
                <Card className="flex flex-col gap-4">
                    {/* user's name */}
                    <LabelledInput
                        text="Name"
                        id="name"
                        type="text"
                        placeholder={"Your name"}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />

                    <LabelledInput
                        text="Email"
                        id="email"
                        type="email"
                        value={user.email}
                        remark={
                            "This account is connected to your Google account."
                        }
                        readOnly
                    />

                    {/* user's phone */}
                    <LabelledInput
                        text={"Phone Number (optional)"}
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        id="phoneNumber"
                        type="tel"
                    />

                    {/* save it up up up!*/}
                    <div className="pt-2 flex flex-row gap-2">
                        <Button type="submit" color={"SUCCESS"}>
                            Save
                        </Button>

                        <Button color="ERROR">Delete my Account</Button>

                        <Button
                            color="INFO"
                            onClick={() => setTheme((prev) => !prev)}
                        >
                            Change Theme
                        </Button>
                    </div>
                </Card>
            </form>
        </div>
    )
}
