import { useEffect, useState } from "react"
import { getUser, updateUsername } from "@features/auth/user.api.ts"
import { useAtom } from "jotai"
import { settingsSaveLoading } from "@features/sync/settings/settings.atom.ts"
import toast from "react-hot-toast"
import { Card, Input } from "@umnburrow/core"
import { useQuery } from "@tanstack/react-query"

/**
 * Settings involving a user's account.
 */
export default function AccountSettings() {
    const { data } = useQuery({
        queryKey: ["user"],
        queryFn: async () => await getUser()
    })

    const [name, setName] = useState<string>("")
    const [errors, setErrors] = useState<string[]>([])
    const [, setLoading] = useAtom(settingsSaveLoading)

    // Load user data when available
    useEffect(() => {
        if (data?.user?.username) {
            setName(data.user.username)
        }
    }, [data?.user?.username])

    // Submit form
    async function onSubmit() {
        if (!data?.user) return

        setErrors([])

        if (name.trim().length === 0) {
            setErrors(["Name cannot be empty."])
            return
        }

        if (errors.length === 0 && name !== data.user.username) {
            try {
                setLoading(true)
                await updateUsername(name)

                toast.success("Successfully saved preferences")
            } catch (error) {
                setErrors([`${error}`])
            } finally {
                setLoading(false)
            }
        }
    }

    return (
        <Card className="flex flex-col gap-4">
            {/* errors provided by backend */}
            {errors.length > 0 && (
                <div className="border-error/30 bg-error/10 text-error mb-2 rounded-lg border p-3 text-sm">
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

            {data?.user == null ? (
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
                            value={data?.email}
                            remark={
                                "This account is connected to your Google account."
                            }
                            readOnly
                        />
                    </form>
                </>
            )}
        </Card>
    )
}
