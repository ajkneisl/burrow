/**
 * Request to delete an account.
 */
export default function Delete() {
    return (
        <div className="flex flex-col items-center justify-center">
            <div className="mt-4 flex max-w-lg flex-col">
                <h1 className="text-secondary text-3xl font-extrabold tracking-tight">
                    Account Deletion Request
                </h1>
                <p>
                    To delete your account and the data related to it, please
                    send an email to{" "}
                    <a
                        href="mailto:privacy@umn.app"
                        className="text-info hover:text-info-hover underline"
                    >
                        deletion@umn.app
                    </a>{" "}
                    from the email associated with your account.
                    <br />
                    <br />
                    We will reply shortly with confirmation that your account
                    has been deleted.
                    <br />
                    <br />
                    If you are logged into your account, go to your account
                    settings and select "Delete Account" to start this process
                    automatically.
                </p>
            </div>
        </div>
    )
}
