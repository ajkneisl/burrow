/**
 * A view for the relations modal.
 *
 * @param title The title of the modal.
 * @param key The relation to retrieve, like `followers`.
 * @param forUserID The user ID to retrieve these relations for.
 */
export type RelationView = {
    title: string
    key: string
    forUserID?: string
}
