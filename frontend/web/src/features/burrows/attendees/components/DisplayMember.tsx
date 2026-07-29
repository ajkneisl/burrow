import type { Profile } from "@features/profile/profile.model.ts"
import ProfilePicture from "@features/profile/components/ProfilePicture.tsx"
import { Button } from "@umnburrow/core"
import { useNavigate } from "react-router"
import clsx from "clsx"

/**
 * {@see DisplayMember}
 *
 * @param username The username of the member.
 * @param profile The profile of the member.
 * @param isSelf If the displayed user is the user who is logged in.
 * @param statusText The text of the badge on the right.
 * @param statusColor The color of the badge on the right.
 * @param footer The footer of the card.
 * @param functions Any functions to display on the bottom to mutate the member.
 */
type DisplayMemberProps = {
    username: string
    profile: Profile
    isSelf: boolean
    statusText: string
    statusColor: string
    footer: React.ReactNode
    functions: Record<string, () => void>
}

/**
 * Display a member within a Burrow.
 *
 * @param props The details to show.
 *
 * @see InviteRequest
 * @see JoinRequest
 * @see Attendee
 *
 * @author AJ Kneisl
 */
export default function DisplayMember(props: DisplayMemberProps) {
    const nav = useNavigate()

    return (
        <li
            key={`${props.profile.userID}`}
            className="rounded-2xl border border-background/80 bg-background/60 p-4"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div>
                        {/* user details */}
                        <div className="flex items-center gap-2">
                            <div
                                onClick={() => nav(`/user/${props.username}`)}
                                className="group mb-4 flex cursor-pointer flex-row items-center gap-2"
                            >
                                <ProfilePicture
                                    name={props.profile.name}
                                    userID={props.profile.userID}
                                    size={"sm"}
                                />

                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold">
                                        {props.profile.name}

                                        {props.isSelf && (
                                            <span className="ml-1 text-[10px] font-normal text-text/60">
                                                (you)
                                            </span>
                                        )}
                                    </span>

                                    <span className="text-xs text-text/70">
                                        @{props.username}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* footer and functions*/}
                        <div className="text-xs text-text/50">
                            {props.footer}

                            {Object.keys(props.functions).length > 0 &&
                                Object.keys(props.functions).map((key) => {
                                    const func = props.functions[key]

                                    return (
                                        <Button
                                            color="LINK"
                                            className="ml-2 text-xs text-text/50"
                                            onClick={() => func()}
                                        >
                                            {key}
                                        </Button>
                                    )
                                })}
                        </div>
                    </div>
                </div>

                {/* status badge */}
                <span
                    className={clsx(
                        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
                        props.statusColor
                    )}
                >
                    {props.statusText}
                </span>
            </div>
        </li>
    )
}
