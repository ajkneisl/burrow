export default function Privacy() {
    return (
        <main className="min-h-screen bg-background text-text">
            <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
                <header className="mb-8">
                    <h1 className="text-3xl font-extrabold tracking-tight text-secondary">
                        Privacy Policy
                    </h1>
                    <p className="mt-2 text-sm text-text/0.75">
                        <span className="font-medium">Effective:</span>{" "}
                        {"October 7, 2025"} &nbsp;•&nbsp;
                        <span className="font-medium">Last Updated:</span>{" "}
                        {"October 7, 2025"}
                    </p>
                </header>

                <div className="rounded-2xl border border-text/0.12 bg-background p-6 shadow-sm">
                    <p className="mb-6">
                        At <span className="font-semibold">Burrow (umn.app)</span>, your
                        privacy is important to us. This policy explains what we
                        collect, how we use it, and your choices.
                    </p>

                    {/* 1. Information We Collect */}
                    <section className="mb-6">
                        <h2 className="text-xl font-bold text-secondary">
                            1. Information We Collect
                        </h2>
                        <ul className="mt-3 list-disc pl-5 space-y-2">
                            <li>
                                <span className="font-medium">
                                    Google Sign-In:
                                </span>{" "}
                                When you log in with Google, we store your{" "}
                                <span className="font-medium">name</span>,{" "}
                                <span className="font-medium">email</span>, and{" "}
                                <span className="font-medium">
                                    Google account ID
                                </span>{" "}
                                provided by Google's authentication service.
                            </li>
                            <li>
                                <span className="font-medium">Optional:</span>{" "}
                                You may choose to provide a{" "}
                                <span className="font-medium">
                                    phone number
                                </span>
                                .
                            </li>
                            <li>
                                We do <span className="font-semibold">not</span>{" "}
                                collect additional personal data beyond what you
                                provide.
                            </li>
                        </ul>
                    </section>

                    {/* 2. How We Use Your Information */}
                    <section className="mb-6">
                        <h2 className="text-xl font-bold text-secondary">
                            2. How We Use Your Information
                        </h2>
                        <ul className="mt-3 list-disc pl-5 space-y-2">
                            <li>Create and maintain your account.</li>
                            <li>
                                Enable features that require authentication.
                            </li>
                            <li>
                                Contact you for account or support purposes, if
                                necessary.
                            </li>
                        </ul>
                        <p className="mt-3">
                            We do <span className="font-semibold">not</span>{" "}
                            sell, rent, or share your personal information with
                            advertisers or unrelated third parties.
                        </p>
                    </section>

                    {/* 3. Data Storage and Security */}
                    <section className="mb-6">
                        <h2 className="text-xl font-bold text-secondary">
                            3. Data Storage & Security
                        </h2>
                        <p className="mt-3">
                            We use industry-standard safeguards to protect your
                            information and restrict access to authorized
                            personnel who operate the site.
                        </p>
                    </section>

                    {/* 4. Data Retention and Deletion */}
                    <section className="mb-6">
                        <h2 className="text-xl font-bold text-secondary">
                            4. Data Retention & Deletion
                        </h2>
                        <p className="mt-3">
                            You may request deletion of your account and
                            associated personal information at any time by
                            emailing{" "}
                            <a
                                href="mailto:privacy@umn.app"
                                className="underline text-info hover:text-info-hover"
                            >
                                privacy@umn.app
                            </a>
                            . After verifying your request, we will permanently
                            delete your information within a reasonable
                            timeframe.
                        </p>
                    </section>

                    {/* 5. Third-Party Authentication */}
                    <section className="mb-6">
                        <h2 className="text-xl font-bold text-secondary">
                            5. Third-Party Authentication
                        </h2>
                        <p className="mt-3">
                            Login is provided by{" "}
                            <span className="font-medium">Google Sign-In</span>.
                            Your use of Google Sign-In is subject to Google's
                            terms and privacy policy in addition to this policy.
                        </p>
                    </section>

                    {/* 6. Your Rights */}
                    <section className="mb-6">
                        <h2 className="text-xl font-bold text-secondary">
                            6. Your Rights
                        </h2>
                        <ul className="mt-3 list-disc pl-5 space-y-2">
                            <li>
                                Access the personal information we hold about
                                you.
                            </li>
                            <li>
                                Request correction or deletion of your data.
                            </li>
                            <li>
                                Withdraw consent to data storage at any time.
                            </li>
                        </ul>
                        <p className="mt-3">
                            To exercise these rights, contact us at{" "}
                            <a
                                href="mailto:privacy@umn.app"
                                className="underline text-info hover:text-info-hover"
                            >
                                privacy@umn.app
                            </a>
                            .
                        </p>
                    </section>

                    {/* 7. Changes to This Policy */}
                    <section className="mb-6">
                        <h2 className="text-xl font-bold text-secondary">
                            7. Changes to This Policy
                        </h2>
                        <p className="mt-3">
                            We may update this policy periodically to reflect
                            changes in practices or legal requirements. Updates
                            will be posted here with a revised “Last Updated”
                            date.
                        </p>
                    </section>

                    {/* 8. Contact */}
                    <section>
                        <h2 className="text-xl font-bold text-secondary">
                            8. Contact Us
                        </h2>
                        <p className="mt-3">
                            Questions or requests? Email{" "}
                            <a
                                href="mailto:privacy@umn.app"
                                className="underline text-info hover:text-info-hover"
                            >
                                privacy@umn.app
                            </a>
                            .
                        </p>
                    </section>
                </div>
            </section>
        </main>
    )
}
