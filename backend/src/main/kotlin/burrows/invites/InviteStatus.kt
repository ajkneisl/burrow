package app.burrow.burrows.invites

/** The status of an invitation. */
enum class InviteStatus {
    /** The invitation is pending acceptance */
    PENDING,

    /** The invitation has been accepted */
    ACCEPTED,

    /** The invitation has been declined */
    DECLINED,

    /** The invitation has expired */
    EXPIRED,
}
