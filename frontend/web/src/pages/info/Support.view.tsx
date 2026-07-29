/**
 * Support
 *
 * @author AJ Kneisl
 */
export default function Support() {
    return (
        <div className="flex flex-col items-center justify-center">
            <div className="mt-4 flex max-w-lg flex-col">
                <h1 className="text-3xl font-extrabold tracking-tight text-secondary">
                    Support
                </h1>
                <p>
                    For assistance with anything Burrow, please email us at{" "}
                    <a
                        href="mailto:support@umn.app"
                        className="text-info underline hover:text-info-hover"
                    >
                        support@umn.app
                    </a>
                    .
                    <br />
                    <br />
                    For something specific in the website, please press the top
                    right menu and select "Report Feedback."
                </p>
            </div>
        </div>
    )
}
