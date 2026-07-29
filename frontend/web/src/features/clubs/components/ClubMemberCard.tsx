import type {
    ClubMemberResponse,
    ClubRole
} from "@features/clubs/clubs.types.tsx"
import { changeClubRole } from "@features/clubs/clubs.api.ts"
import ProfilePicture from "@features/profile/components/ProfilePicture.tsx"
import { formatTimeAgo } from "@api/util.ts"
import { useNavigate } from "react-router"
import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import clsx from "clsx"
import { ChevronDown, Crown, UserRound, Shield, X, Check } from "lucide-react"
import toast from "react-hot-toast"
import { Button, Input } from "@umnburrow/core"
import useClubRole from "@features/clubs/hooks/useClubRole.ts"

function roleBadgeColor(role: ClubRole): string {
    switch (role) {
        case "ADMINISTRATOR":
            return "bg-yellow-100 text-yellow-800 border-yellow-200"
        case "MODERATOR":
            return "bg-indigo-100 text-indigo-800 border-indigo-200"
        default:
            return "bg-gray-100 text-gray-800 border-gray-200"
    }
}

function roleIcon(role: ClubRole) {
    switch (role) {
        case "ADMINISTRATOR":
            return <Crown className="size-3" />
        case "MODERATOR":
            return <Shield className="size-3" />
        default:
            return <UserRound className="size-3" />
    }
}

/**
 * {@link ClubMemberCard}
 */
type ClubMemberCardProps = {
    data: ClubMemberResponse
    clubName: string
}

/**
 * An individual member of a club.
 *
 * @param data
 * @param clubName
 *
 * @author AJ Kneisl
 */
export default function ClubMemberCard({
    data,
    clubName
}: ClubMemberCardProps) {
    const nav = useNavigate()
    const queryClient = useQueryClient()
    const { member, user, profile } = data
    const { isAdmin, user: currentUser, data: clubData } = useClubRole(clubName)
    const isSelf = currentUser?.id === member.userID
    const isOwner = member.userID === clubData?.club?.ownerID

    const [editing, setEditing] = useState(false)
    const [selectedRole, setSelectedRole] = useState<ClubRole>(member.role)
    const [customRoleName, setCustomRoleName] = useState(member.roleName || "")
    const [saving, setSaving] = useState(false)

    const roleLabel = member.roleName || member.role
    const canEdit = isAdmin && !isSelf && !isOwner

    async function handleSave() {
        setSaving(true)
        try {
            await changeClubRole(
                clubName,
                member.userID,
                selectedRole,
                customRoleName.trim() || undefined
            )
            void queryClient.invalidateQueries({
                queryKey: ["clubMembers", clubName]
            })
            toast.success(`Updated ${profile.name}'s role.`)
            setEditing(false)
        } catch (err) {
            toast.error(
                typeof err === "string" ? err : "Failed to update role."
            )
        } finally {
            setSaving(false)
        }
    }

    function handleCancel() {
        setSelectedRole(member.role)
        setCustomRoleName(member.roleName || "")
        setEditing(false)
    }

    return (
        <li className="rounded-2xl border border-background/80 bg-background/60 p-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div>
                        <div
                            onClick={() => nav(`/user/${user.username}`)}
                            className="group mb-2 flex cursor-pointer flex-row items-center gap-2"
                        >
                            <ProfilePicture
                                name={profile.name}
                                userID={profile.userID}
                                size="sm"
                            />
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold">
                                    {profile.name}
                                    {isSelf && (
                                        <span className="ml-1 text-[10px] font-normal text-text/60">
                                            (you)
                                        </span>
                                    )}
                                </span>
                                <span className="text-xs text-text/70">
                                    @{user.username}
                                </span>
                            </div>
                        </div>

                        <div className="text-xs text-text/50">
                            Joined {formatTimeAgo(member.joinedAt)}
                        </div>
                    </div>
                </div>

                {canEdit ? (
                    <button
                        onClick={() => setEditing(true)}
                        className={clsx(
                            "inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-opacity hover:opacity-80",
                            roleBadgeColor(member.role)
                        )}
                    >
                        {roleIcon(member.role)}
                        {roleLabel}
                        <ChevronDown className="size-3 opacity-50" />
                    </button>
                ) : (
                    <span
                        className={clsx(
                            "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold",
                            roleBadgeColor(member.role)
                        )}
                    >
                        {roleIcon(member.role)}
                        {roleLabel}
                    </span>
                )}
            </div>

            {editing && (
                <div className="mt-3 space-y-3 border-t border-text/10 pt-3">
                    {canEdit && (
                        <div className="flex flex-wrap gap-1.5">
                            {(
                                [
                                    "ADMINISTRATOR",
                                    "MODERATOR",
                                    "MEMBER"
                                ] as ClubRole[]
                            ).map((role) => (
                                <button
                                    key={role}
                                    onClick={() => setSelectedRole(role)}
                                    className={clsx(
                                        "inline-flex cursor-pointer items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-all",
                                        selectedRole === role
                                            ? roleBadgeColor(role)
                                            : "border-text/10 text-text/40 hover:border-text/20"
                                    )}
                                >
                                    {roleIcon(role)}
                                    {role.charAt(0) +
                                        role.slice(1).toLowerCase()}
                                </button>
                            ))}
                        </div>
                    )}

                    <div>
                        <label className="mb-1 block text-xs text-text/60">
                            Custom role name (optional)
                        </label>
                        <Input
                            value={customRoleName}
                            onChange={(e) => setCustomRoleName(e.target.value)}
                            placeholder="e.g. Vice President"
                        />
                        <p className="mt-1 text-[10px] text-text/40">
                            3-16 characters,
                            letters/numbers/spaces/hyphens/underscores
                        </p>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        <Button thin onClick={handleCancel} disabled={saving}>
                            <X className="size-3.5" />
                            Cancel
                        </Button>
                        <Button
                            thin
                            color="SUCCESS"
                            onClick={handleSave}
                            loading={saving}
                        >
                            <Check className="size-3.5" />
                            Save
                        </Button>
                    </div>
                </div>
            )}
        </li>
    )
}
