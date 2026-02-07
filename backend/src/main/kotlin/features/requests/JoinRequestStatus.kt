package app.burrow.features.requests

/** The status of a join request. */
enum class JoinRequestStatus {
    /** The request is pending approval */
    PENDING,

    /** The request has been approved */
    APPROVED,

    /** The request has been rejected */
    REJECTED,
}
