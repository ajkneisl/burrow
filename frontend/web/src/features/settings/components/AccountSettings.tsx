import useUser from "@features/auth/api/hooks/useUser.ts"
import useToken from "@features/auth/api/hooks/useToken.ts"
import { useEffect, useState } from "react"
import { updateUser } from "@features/auth/api/user.api.ts"
import { useAtom } from "jotai"
import { settingsSaveLoading } from "@features/settings/api/settings.atom.ts"
import toast from "react-hot-toast"
import { Card, Input } from "@umnburrow/core"

/**
 * Settings involving a user's account.
 */
export default function AccountSettings() {
    const user = useUser()
    const auth = useToken()

    const [name, setName] = useState<string>("")
    const [phoneNumber, setPhoneNumber] = useState<string>("")
    const [errors, setErrors] = useState<string[]>([])
    const [, setLoading] = useAtom(settingsSaveLoading)

    // auto load in user and phone
    useEffect(() => {
        if (user) {
            setName(user.name ?? "")
            setPhoneNumber(user.phoneNumber ?? "")
        }
    }, [user])

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
                if (phoneNumber !== (user.phoneNumber ?? "")) {
                    await updateUser(auth, "phone", phoneNumber)
                }

                // if name has been changed
                if (name !== (user.name ?? "")) {
                    await updateUser(auth, "name", name)
                }
            }
        } catch (e: any) {
            nextErrors.push(e?.message || "Failed to save settings.")
        } finally {
            if (nextErrors.length > 0) {
                setErrors(nextErrors)
            } else {
                toast.success("Successfully saved preferences")
            }

            setLoading(false)
        }
    }

    return (
        <Card className="flex flex-col gap-4">
            {/* errors provided by backend */}
            {errors.length > 0 && (
                <div className="mb-2 rounded-lg border border-error/30 bg-error/10 p-3 text-sm text-error">
                    <p className="mb-1 font-medium">
                        Please fix the following:
                    </p>
                    <ul className="list-disc space-y-1 pl-5">
                        {errors.map((err, i) => (
                            <li key={i}>{err}</li>
                        ))}
                    </ul>
                </div>
            )}

            {user == null ? (
                <div className="flex h-40 items-center justify-center text-gray-500">
                    Loading...
                </div>
            ) : (
                <>
                    <form
                        id="account-form"
                        className="flex flex-col gap-4"
                        onSubmit={async (e) => {
                            e.preventDefault()
                            await onSubmit()
                        }}
                    >
                        {/* user's name */}
                        <Input
                            text="Name"
                            id="name"
                            type="text"
                            placeholder={"Your name"}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />

                        <Input
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
                        <Input
                            text={"Phone Number (optional)"}
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            id="phoneNumber"
                            type="tel"
                        />
                    </form>
                </>
            )}
        </Card>
    )
}
