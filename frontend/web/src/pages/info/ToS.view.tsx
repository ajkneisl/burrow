/**
 * The Terms of Service
 *
 * @author AJ Kneisl
 */
export default function ToS() {
    return (
        <main className="min-h-screen bg-background text-text">
            <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-extrabold tracking-tight text-secondary">
                        Terms of Service
                    </h1>
                    <p className="mt-2 text-sm text-text/0.75">
                        Effective Date: October 7, 2025
                    </p>
                </header>

                <div className="border-text/0.12 rounded-2xl border bg-background p-6 shadow-sm">
                    <p className="mb-6">
                        Welcome to <span className="font-semibold">Burrow</span>
                        , a study group and meeting platform designed to help
                        students, friends, and clubs connect for productive
                        collaboration. By using this site, you agree to follow
                        these Terms of Service. If you do not agree, you may not
                        use the platform.
                    </p>

                    {/* Section 1 */}
                    <section className="mb-6">
                        <h2 className="text-xl font-bold text-secondary">
                            1. Purpose of the Service
                        </h2>
                        <p className="mt-3">
                            Burrow allows users to create and join{" "}
                            <span className="font-medium">Study Groups</span>{" "}
                            for the purpose of:
                        </p>
                        <ul className="mt-3 list-disc space-y-2 pl-5">
                            <li>
                                Collaborative studying and coursework
                                discussions
                            </li>
                            <li>Organizing or attending club meetings</li>
                            <li>Connecting with peers or friends</li>
                        </ul>
                        <p className="mt-3">
                            The service is intended solely for lawful, academic,
                            and community-oriented use. Any activity outside
                            this scope, such as harassment, cheating, or
                            malicious behavior, is strictly prohibited.
                        </p>
                    </section>

                    {/* Section 2 */}
                    <section className="mb-6">
                        <h2 className="text-xl font-bold text-secondary">
                            2. User Conduct
                        </h2>
                        <p className="mt-3">
                            You agree to use Burrow responsibly and
                            respectfully. Users must not:
                        </p>
                        <ul className="mt-3 list-disc space-y-2 pl-5">
                            <li>
                                Post, share, or transmit any inappropriate,
                                offensive, or harmful content.
                            </li>
                            <li>
                                Use Study Groups, chat boxes, or other site
                                features for harassment, bullying, or malicious
                                behavior.
                            </li>
                            <li>
                                Share misinformation, spam, or content unrelated
                                to legitimate study or meeting purposes.
                            </li>
                            <li>
                                Attempt to exploit, damage, or disrupt the
                                service or the experience of other users.
                            </li>
                        </ul>
                        <p className="mt-3">
                            All names, group descriptions, and content submitted
                            must be appropriate for a university setting and
                            align with the general behavioral expectations of
                            the{" "}
                            <span className="font-medium">
                                University of Minnesota's Code of Conduct
                            </span>
                            , though Burrow is not affiliated with the
                            University of Minnesota.
                        </p>
                    </section>

                    {/* Section 3 */}
                    <section className="mb-6">
                        <h2 className="text-xl font-bold text-secondary">
                            3. Account Information
                        </h2>
                        <p className="mt-3">
                            Users sign in via Google. You are responsible for
                            all activity under your account and must keep your
                            login credentials secure.
                        </p>
                    </section>

                    {/* Section 4 */}
                    <section className="mb-6">
                        <h2 className="text-xl font-bold text-secondary">
                            4. Content Guidelines
                        </h2>
                        <p className="mt-3">
                            Users are responsible for all text, images, and
                            materials they upload or post. You agree that your
                            content will not:
                        </p>
                        <ul className="mt-3 list-disc space-y-2 pl-5">
                            <li>
                                Include hate speech, discrimination, or explicit
                                material.
                            </li>
                            <li>
                                Encourage illegal activities or violate academic
                                integrity standards.
                            </li>
                            <li>
                                Impersonate others or misrepresent your
                                affiliation or intentions.
                            </li>
                        </ul>
                        <p className="mt-3">
                            Burrow reserves the right to remove any content or
                            group that violates these rules.
                        </p>
                    </section>

                    {/* Section 5 */}
                    <section className="mb-6">
                        <h2 className="text-xl font-bold text-secondary">
                            5. Termination of Use
                        </h2>
                        <p className="mt-3">
                            We reserve the right to suspend or terminate any
                            account that engages in misuse of the platform,
                            posts inappropriate content, or otherwise violates
                            these Terms.
                        </p>
                    </section>

                    {/* Section 6 */}
                    <section className="mb-6">
                        <h2 className="text-xl font-bold text-secondary">
                            6. Relationship to the University of Minnesota
                        </h2>
                        <p className="mt-3">
                            Burrow is an independent platform and is{" "}
                            <span className="font-semibold">
                                not affiliated with
                            </span>{" "}
                            or endorsed by the University of Minnesota. However,
                            we expect users to conduct themselves in a manner
                            consistent with the University's community standards
                            and values.
                        </p>
                    </section>

                    {/* Section 7 */}
                    <section className="mb-6">
                        <h2 className="text-xl font-bold text-secondary">
                            7. Limitation of Liability
                        </h2>
                        <p className="mt-3">
                            Burrow provides its services “as is.” We make no
                            guarantees about the availability, accuracy, or
                            reliability of the service. We are not responsible
                            for any damages arising from your use of the site.
                        </p>
                    </section>

                    {/* Section 8 */}
                    <section>
                        <h2 className="text-xl font-bold text-secondary">
                            8. Contact
                        </h2>
                        <p className="mt-3">
                            Questions about these Terms or your account? Contact
                            us at{" "}
                            <a
                                href="mailto:privacy@umn.app"
                                className="text-info underline hover:text-info-hover"
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
