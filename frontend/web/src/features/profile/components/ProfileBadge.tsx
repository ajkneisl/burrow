import { Hover } from "@umnburrow/core"
import { CDN_URL } from "@api/util.ts"

/**
 * {@link ProfileBadge}
 */
type ProfileBadgeProps = {
    id: string
    description: string
}

/**
 * A badge that goes on a user's profile.
 *
 * @param id The unique ID of the badge.
 * @parma description The description of the badge.
 *
 * @author AJ Kneisl
 */
export default function ProfileBadge({ id, description }: ProfileBadgeProps) {
    return (
        <Hover content={description}>
            <img
                height={32}
                width={32}
                src={`${CDN_URL}/badges/${id}`}
                alt={description}
            />
        </Hover>
    )
}
