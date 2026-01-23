import { useEffect, useState } from "react"
import {
    deleteAccount,
    getUser,
    updateUsername
} from "@features/auth/user.api.ts"
import { useSetAtom } from "jotai"
import {
    settingsChanged,
    settingsSaveLoading
} from "@features/settings/settings.atom.ts"
import toast from "react-hot-toast"
import { Button, Card, Input } from "@umnburrow/core"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router"
import { Trash2 } from "lucide-react"

/**
 * Settings involving a user's account.
 *
 * @author AJ Kneisl
 */
export default function AccountSection() {
    const navigate = useNavigate()
    const { data } = useQuery({
        queryKey: ["user"],
        queryFn: async () => await getUser()
    })

    const [name, setName] = useState<string>("")
    const [errors, setErrors] = useState<string[]>([])

    const setChanged = useSetAtom(settingsChanged)
    const setLoading = useSetAtom(settingsSaveLoading)

    useEffect(() => {
        if (data?.user?.username) {
            setName(data.user.username)
        }
    }, [data?.user?.username])

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
        } else {
            setLoading(false)
        }
    }

    function handleDeleteAccount() {
        toast(
            (t) => (
                <div className="flex flex-col gap-3">
                    <div>
                        <p className="font-semibold">Delete Account</p>
                        <p className="text-text/60 text-sm">
                            Are you sure? This action cannot be undone.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            color="ERROR"
                            onClick={async () => {
                                try {
                                    await deleteAccount()
                                    toast.success(
                                        "Account deleted successfully"
                                    )
                                    navigate("/")
                                } catch (error) {
                                    toast.error(
                                        `Failed to delete account: ${error}`
                                    )
                                } finally {
                                    toast.dismiss(t.id)
                                }
                            }}
                        >
                            Delete
                        </Button>
                        <Button onClick={() => toast.dismiss(t.id)}>
                            Cancel
                        </Button>
                    </div>
                </div>
            ),
            {
                duration: Infinity,
                position: "top-center"
            }
        )
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
                            onChange={(e) => {
                                setChanged(true)
                                setName(e.target.value)
                            }}
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

                    {/* delete account section */}
                    <div className="border-error/20 mt-6 border-t pt-6">
                        <Button color="ERROR" onClick={handleDeleteAccount}>
                            <Trash2 className="h-4 w-4" />
                            Delete Account
                        </Button>
                    </div>
                </>
            )}
        </Card>
    )
}
