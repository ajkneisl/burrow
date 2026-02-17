import { useNavigate, useParams } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { Users, Shield, Crown, UserRound, Pencil, UserPlus, CalendarClock, Calendar, ChevronDown, Check, X } from "lucide-react"
import useUser from "@features/auth/hooks/useUser.ts"
import useToken from "@features/auth/hooks/useToken.ts"
import useMetaTags from "@features/layout/hooks/useMetaTags.ts"
import { getClub, getClubMembers, joinClub, leaveClub, cancelClubJoinRequest, getClubBurrows, changeClubRole } from "@features/clubs/clubs.api.ts"
import type { ClubMemberResponse, ClubResponse } from "@features/clubs/clubs.types.ts"
import type { ClubRole } from "@features/clubs/clubs.types.ts"
import type { BurrowResponse } from "@features/burrows/burrows.types.tsx"
import { NOT_REOCCURRING } from "@features/burrows/burrows.types.tsx"
import type { PaginatedResponse } from "@api/api.types.ts"
import { formatTimeAgo } from "@api/util.ts"
import ProfilePicture from "@features/profile/components/ProfilePicture.tsx"
import { BurrowCard } from "@features/burrows/components/BurrowCard.tsx"
import ClubProfilePicture from "@features/clubs/components/ClubProfilePicture.tsx"
import ClubBanner from "@features/clubs/components/ClubBanner.tsx"
import EditClubModal from "@features/clubs/components/EditClubModal.tsx"
import InviteClubMemberModal from "@features/clubs/components/InviteClubMemberModal.tsx"
import { Button, Card, Input, ViewErrors } from "@umnburrow/core"
import { useMemo, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "react-hot-toast"
import clsx from "clsx"

const ROLE_ORDER: Record<ClubRole, number> = {
    ADMINISTRATOR: 0,
    MODERATOR: 1,
    MEMBER: 2
}

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
            return <Crown className="h-3 w-3" />
        case "MODERATOR":
            return <Shield className="h-3 w-3" />
        default:
            return <UserRound className="h-3 w-3" />
    }
}

export default function ClubView() {
    const { name } = useParams<{ name: string }>()
    const auth = useToken()
    const user = useUser()
    const queryClient = useQueryClient()

    const [membersPage, setMembersPage] = useState(1)
    const [joinLoading, setJoinLoading] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [inviteOpen, setInviteOpen] = useState(false)

    const { data, isLoading, error, refetch } = useQuery<ClubResponse>({
        queryKey: ["club", name],
        enabled: auth !== "" && !!name,
        queryFn: async () => await getClub(name!)
    })

    const {
        data: members,
        isLoading: membersLoading
    } = useQuery<PaginatedResponse<ClubMemberResponse>>({
        queryKey: ["clubMembers", name, membersPage],
        enabled: auth !== "" && !!name,
        queryFn: async () => await getClubMembers(name!, membersPage)
    })

    const { data: burrows } = useQuery<BurrowResponse[]>({
        queryKey: ["clubBurrows", name],
        enabled: auth !== "" && !!name,
        queryFn: async () => await getClubBurrows(name!)
    })

    useMetaTags({
        title: `Burrow — ${data?.club?.displayName ?? "Club"}`,
        description: `View ${data?.club?.displayName ?? "this club"} on Burrow`,
        url: `https://umn.app/club/${name}`,
        image: "https://umn.app/burrow.png"
    })

    const isOwner = user !== null && user.id === data?.club?.ownerID
    const isMember = data?.membership !== null
    const isAdmin = data?.membership?.role === "ADMINISTRATOR" || isOwner
    const isMod = isAdmin || data?.membership?.role === "MODERATOR"

    const sortedMembers = useMemo(() => {
        if (!members?.contents) return []
        return [...members.contents].sort(
            (a, b) =>
                (ROLE_ORDER[a.member.role] ?? 3) -
                (ROLE_ORDER[b.member.role] ?? 3)
        )
    }, [members])

    const reoccurringBurrows = useMemo(
        () => (burrows ?? []).filter((b) => b.burrow.reoccurring !== NOT_REOCCURRING),
        [burrows]
    )

    const upcomingBurrows = useMemo(
        () => (burrows ?? []).filter((b) => b.burrow.reoccurring === NOT_REOCCURRING),
        [burrows]
    )

    const handleJoinLeave = async () => {
        if (!name || !user) return
        setJoinLoading(true)

        try {
            if (isMember) {
                await leaveClub(name)
                void queryClient.invalidateQueries({ queryKey: ["club", name] })
                void queryClient.invalidateQueries({ queryKey: ["clubMembers", name] })
            } else if (data?.requestedToJoin) {
                await cancelClubJoinRequest(name)
                queryClient.setQueryData<ClubResponse>(["club", name], (old) =>
                    old ? { ...old, requestedToJoin: false } : old
                )
            } else {
                await joinClub(name)
                if (data?.club?.requestToJoin) {
                    queryClient.setQueryData<ClubResponse>(["club", name], (old) =>
                        old ? { ...old, requestedToJoin: true } : old
                    )
                    toast.success("You have requested to join.")
                } else {
                    void queryClient.invalidateQueries({ queryKey: ["club", name] })
                    void queryClient.invalidateQueries({ queryKey: ["clubMembers", name] })
                }
            }
        } catch (err) {
            toast.error(typeof err === "string" ? err : "An error occurred")
        } finally {
            setJoinLoading(false)
        }
    }

    const joinButtonText = useMemo(() => {
        if (isMember) return "Leave"
        if (data?.requestedToJoin) return "Cancel Request"
        return data?.club?.requestToJoin ? "Request to Join" : "Join"
    }, [isMember, data?.requestedToJoin, data?.club?.requestToJoin])

    const isDestructive = joinButtonText === "Leave" || joinButtonText === "Cancel Request"

    // Loading skeleton
    if (isLoading) {
        return (
            <main className="min-h-screen">
                <section className="relative isolate">
                    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            <Card className="order-first col-span-1 p-6 lg:col-span-3">
                                <div className="animate-pulse space-y-4">
                                    <div className="bg-text/10 h-8 w-3/4 rounded-lg" />
                                    <div className="flex items-center gap-2">
                                        <div className="bg-text/10 h-10 w-10 rounded-full" />
                                        <div className="bg-text/10 h-4 w-48 rounded" />
                                    </div>
                                </div>
                            </Card>
                            <div className="col-span-1 space-y-6 lg:col-span-2">
                                <Card className="p-6">
                                    <div className="animate-pulse space-y-2">
                                        <div className="bg-text/10 h-5 w-32 rounded" />
                                        <div className="bg-text/10 h-4 w-full rounded" />
                                        <div className="bg-text/10 h-4 w-3/4 rounded" />
                                    </div>
                                </Card>
                            </div>
                            <div className="order-[-1] col-span-1 space-y-6 md:order-2">
                                <Card className="p-6">
                                    <div className="animate-pulse space-y-3">
                                        <div className="bg-text/10 h-5 w-24 rounded" />
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="flex items-center gap-2">
                                                <div className="bg-text/10 h-10 w-10 rounded-full" />
                                                <div className="bg-text/10 h-4 w-32 rounded" />
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        )
    }

    if (error || !data || !name) {
        return (
            <div className="mt-4 flex items-center justify-center">
                <ViewErrors errors={[`${error}`]} clearErrors={refetch} />
            </div>
        )
    }

    const { club } = data

    return (
        <main className="min-h-screen">
            <section className="relative isolate">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {/* Header */}
                        <Card className="relative order-first col-span-1 overflow-hidden p-0 md:col-span-2 lg:col-span-3">
                            <ClubBanner clubID={club.id} clubName={name} editable={isAdmin} />

                            <div className="flex flex-col gap-4 p-6">
                                <div className="flex items-start gap-4">
                                    <div className="-mt-12">
                                        <ClubProfilePicture
                                            clubID={club.id}
                                            displayName={club.displayName}
                                            clubName={name}
                                            size="lg"
                                            editable={isAdmin}
                                        />
                                    </div>

                                    <div className="min-w-0 pt-1">
                                        <span className="text-text/50 text-xs font-medium uppercase tracking-wider">
                                            {club.category}
                                        </span>

                                        <h1 className="text-text mt-1 truncate text-xl font-bold tracking-tight md:text-3xl">
                                            {club.displayName}
                                        </h1>
                                        <p className="text-text/40 text-sm font-medium">
                                            /club/{club.name}
                                        </p>

                                        <div className="text-text/60 mt-1 flex items-center gap-1.5 text-sm">
                                            <Users className="h-4 w-4" />
                                            <span>
                                                {data.memberCount} member{data.memberCount !== 1 ? "s" : ""}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-row items-center gap-2">
                                    {!isOwner && (
                                        <Button
                                            thin
                                            onClick={handleJoinLeave}
                                            disabled={!user}
                                            loading={joinLoading}
                                            color={isDestructive ? "ERROR" : "SUCCESS"}
                                        >
                                            {joinButtonText}
                                        </Button>
                                    )}

                                    {isAdmin && (
                                        <Button thin onClick={() => setEditOpen(true)}>
                                            <Pencil className="h-3.5 w-3.5" />
                                            Edit
                                        </Button>
                                    )}

                                    {isMod && (
                                        <Button thin onClick={() => setInviteOpen(true)}>
                                            <UserPlus className="h-3.5 w-3.5" />
                                            Invite
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Main content */}
                        <div className="col-span-1 space-y-6 lg:col-span-2">
                            {/* Description */}
                            <Card title="About">
                                <p className="text-text/80 whitespace-pre-wrap">
                                    {club.description || "No description provided."}
                                </p>
                            </Card>

                            {/* Reoccurring Meetings */}
                            <div>
                                <h3 className="text-text mb-3 text-sm font-semibold">Reoccurring Meetings</h3>
                                {reoccurringBurrows.length === 0 ? (
                                    <div className="flex flex-col items-center gap-2 py-4 text-center">
                                        <CalendarClock className="text-text/30 h-8 w-8" />
                                        <p className="text-text/50 text-sm">No reoccurring meetings.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {reoccurringBurrows.map((b) => (
                                            <BurrowCard key={b.burrow.id} meetingResponse={b} />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Upcoming Meetings */}
                            <div>
                                <h3 className="text-text mb-3 text-sm font-semibold">Meetings</h3>
                                {upcomingBurrows.length === 0 ? (
                                    <div className="flex flex-col items-center gap-2 py-4 text-center">
                                        <Calendar className="text-text/30 h-8 w-8" />
                                        <p className="text-text/50 text-sm">No meetings.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {upcomingBurrows.map((b) => (
                                            <BurrowCard key={b.burrow.id} meetingResponse={b} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar — Members */}
                        <div className="order-[-1] col-span-1 space-y-6 md:order-2">
                            <Card className="min-w-xs">
                                <h3 className="mb-3 text-sm font-semibold">Members</h3>

                                {membersLoading && (
                                    <div className="text-text/60 text-sm">Loading members...</div>
                                )}

                                {!membersLoading && sortedMembers.length === 0 && (
                                    <div className="text-text/50 text-sm">No members yet.</div>
                                )}

                                {!membersLoading && sortedMembers.length > 0 && (
                                    <>
                                        <ul className="flex flex-col gap-3">
                                            {sortedMembers.map((m) => (
                                                <ClubMemberCard
                                                    key={m.member.userID}
                                                    data={m}
                                                    isSelf={user?.id === m.member.userID}
                                                    isMember={isMember}
                                                    isAdmin={isAdmin}
                                                    isOwner={m.member.userID === data.club.ownerID}
                                                    clubName={name}
                                                />
                                            ))}
                                        </ul>

                                        {members && members.totalPages > 1 && (
                                            <div className="mt-4 flex items-center justify-between">
                                                <Button
                                                    disabled={membersPage === 1}
                                                    onClick={() => setMembersPage((p) => p - 1)}
                                                >
                                                    Previous
                                                </Button>
                                                <span className="text-xs">
                                                    Page {membersPage} of {members.totalPages}
                                                </span>
                                                <Button
                                                    disabled={membersPage === members.totalPages}
                                                    onClick={() => setMembersPage((p) => p + 1)}
                                                >
                                                    Next
                                                </Button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            {/* Modals */}
            {isAdmin && (
                <EditClubModal
                    open={editOpen}
                    onClose={() => setEditOpen(false)}
                    club={club}
                />
            )}

            {isMod && (
                <InviteClubMemberModal
                    open={inviteOpen}
                    onClose={() => setInviteOpen(false)}
                    clubName={name}
                />
            )}
        </main>
    )
}

type ClubMemberCardProps = {
    data: ClubMemberResponse
    isSelf: boolean
    isMember: boolean
    isAdmin: boolean
    isOwner: boolean
    clubName: string
}

function ClubMemberCard({ data, isSelf, isMember, isAdmin, isOwner, clubName }: ClubMemberCardProps) {
    const nav = useNavigate()
    const queryClient = useQueryClient()
    const { member, user, profile } = data

    const [editing, setEditing] = useState(false)
    const [selectedRole, setSelectedRole] = useState<ClubRole>(member.role)
    const [customRoleName, setCustomRoleName] = useState(member.roleName || "")
    const [saving, setSaving] = useState(false)

    const roleLabel = member.roleName || member.role
    const canEditFull = isAdmin && !isSelf && !isOwner
    const canEditOwnName = isSelf && isMember
    const canEdit = canEditFull || canEditOwnName

    async function handleSave() {
        setSaving(true)
        try {
            await changeClubRole(clubName, member.userID, canEditOwnName ? member.role : selectedRole, customRoleName.trim() || undefined)
            void queryClient.invalidateQueries({ queryKey: ["clubMembers", clubName] })
            toast.success(`Updated ${profile.name}'s role.`)
            setEditing(false)
        } catch (err) {
            toast.error(typeof err === "string" ? err : "Failed to update role.")
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
        <li className="bg-background/60 border-background/80 rounded-2xl border p-4">
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
                                        <span className="text-text/60 ml-1 text-[10px] font-normal">
                                            (you)
                                        </span>
                                    )}
                                </span>
                                <span className="text-text/70 text-xs">@{user.username}</span>
                            </div>
                        </div>

                        <div className="text-text/50 text-xs">
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
                        <ChevronDown className="h-3 w-3 opacity-50" />
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
                <div className="border-text/10 mt-3 space-y-3 border-t pt-3">
                    {canEditFull && (
                        <div className="flex flex-wrap gap-1.5">
                            {(["ADMINISTRATOR", "MODERATOR", "MEMBER"] as ClubRole[]).map((role) => (
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
                                    {role.charAt(0) + role.slice(1).toLowerCase()}
                                </button>
                            ))}
                        </div>
                    )}

                    <div>
                        <label className="text-text/60 mb-1 block text-xs">
                            Custom role name (optional)
                        </label>
                        <Input
                            value={customRoleName}
                            onChange={(e) => setCustomRoleName(e.target.value)}
                            placeholder="e.g. Vice President"
                        />
                        <p className="text-text/40 mt-1 text-[10px]">
                            3-16 characters, letters/numbers/spaces/hyphens/underscores
                        </p>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        <Button thin onClick={handleCancel} disabled={saving}>
                            <X className="h-3.5 w-3.5" />
                            Cancel
                        </Button>
                        <Button thin color="SUCCESS" onClick={handleSave} loading={saving}>
                            <Check className="h-3.5 w-3.5" />
                            Save
                        </Button>
                    </div>
                </div>
            )}
        </li>
    )
}
