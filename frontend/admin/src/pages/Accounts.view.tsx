import { getAdminAccounts, setAccountType } from "@umnburrow/core/api"
import type { AdminAccount } from "@umnburrow/core/api"
import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Button, Card, Input } from "@umnburrow/core"


import useAdmin from "../features/auth/hooks/useAdmin.ts"

/**
 * Manage administrator accounts.
 *
 * @author AJ Kneisl
 */
export default function AccountsView() {
    const self = useAdmin()
    const queryClient = useQueryClient()

    const { data: admins, isLoading, isError, error, refetch, isFetching } = useQuery({
        queryKey: ["admin", "accounts"],
        queryFn: () => getAdminAccounts(),
        refetchOnWindowFocus: true
    })

    // promote a user
    const [promoteID, setPromoteID] = useState("")

    const promoteMutation = useMutation({
        mutationFn: () => setAccountType(promoteID, "ADMIN"),

        onSuccess: () => {
            setPromoteID("")
            queryClient.invalidateQueries({ queryKey: ["admin", "accounts"] })
        }
    })

    const demoteMutation = useMutation({
        mutationFn: (id: string) => setAccountType(id, "USER"),

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "accounts"] })
        }
    })

    return (
        <div className="mx-auto w-full max-w-6xl p-4 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-2xl font-bold">Administrators</h1>

                <Button onClick={() => refetch()}>
                    {isFetching ? "Refreshing..." : "Refresh"}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* all administrators */}
                <Card className="p-4">
                    <h2 className="text-lg font-semibold mb-4">
                        All Administrators
                    </h2>

                    {isLoading ? (
                        <div className="space-y-2">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="h-16 animate-pulse rounded-lg bg-primary/5"
                                />
                            ))}
                        </div>
                    ) : isError ? (
                        <div className="rounded-lg border border-error/30 bg-error/10 p-4 text-sm">
                            <div className="font-semibold text-error">
                                Failed to load administrators
                            </div>

                            <div className="mt-1 text-muted-foreground">
                                {(error as Error)?.message || "Unknown error"}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {admins?.map((admin: AdminAccount) => (
                                <div
                                    key={admin.id}
                                    className="flex items-center justify-between gap-3 rounded-lg border p-3"
                                >
                                    <div className="min-w-0">
                                        <div className="font-medium truncate">
                                            {admin.username}
                                            {admin.id === self?.id && (
                                                <span className="text-muted-foreground text-sm">
                                                    {" "}
                                                    (you)
                                                </span>
                                            )}
                                        </div>

                                        <div className="text-sm text-muted-foreground truncate">
                                            {admin.email}
                                        </div>
                                    </div>

                                    {admin.id !== self?.id && (
                                        <Button
                                            onClick={() => {
                                                if (
                                                    confirm(
                                                        `Remove administrator access from "${admin.username}"?`
                                                    )
                                                ) {
                                                    demoteMutation.mutate(
                                                        admin.id
                                                    )
                                                }
                                            }}
                                            disabled={demoteMutation.isPending}
                                        >
                                            {demoteMutation.isPending
                                                ? "..."
                                                : "Remove"}
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* promote a user */}
                <Card className="p-4">
                    <h2 className="text-lg font-semibold mb-4">
                        Add Administrator
                    </h2>

                    <div className="space-y-3">
                        <Input
                            value={promoteID}
                            onChange={(e) => setPromoteID(e.target.value)}
                            placeholder="User ID"
                        />

                        <div className="text-xs text-muted-foreground">
                            Grants the user full access to this admin panel.
                        </div>

                        {promoteMutation.isError && (
                            <div className="text-sm text-error">
                                {(promoteMutation.error as Error)?.message ||
                                    "Failed to promote user"}
                            </div>
                        )}

                        {promoteMutation.isSuccess && (
                            <div className="text-sm text-green-600">
                                User promoted to administrator!
                            </div>
                        )}

                        <Button
                            onClick={() => {
                                if (
                                    confirm(
                                        `Grant administrator access to user "${promoteID}"?`
                                    )
                                ) {
                                    promoteMutation.mutate()
                                }
                            }}
                            disabled={!promoteID || promoteMutation.isPending}
                        >
                            {promoteMutation.isPending
                                ? "Promoting..."
                                : "Add Administrator"}
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    )
}
