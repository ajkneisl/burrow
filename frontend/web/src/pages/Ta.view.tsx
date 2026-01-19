import { useNavigate } from "react-router"
import { Button, Card } from "@umnburrow/core"
import useUser from "@features/auth/hooks/useUser.ts"
import { GraduationCap, Mail, Clock, ArrowLeft } from "lucide-react"

/**
 * TA application page.
 *
 * @author AJ Kneisl
 */
export default function TaView() {
    const user = useUser()
    const navigate = useNavigate()

    // must be signed in
    if (!user) {
        return (
            <main className="text-text w-full">
                <div className="mx-auto w-full max-w-2xl px-6 py-12">
                    <Card className="text-center">
                        <h1 className="text-xl font-bold">Sign in required</h1>

                        <p className="text-text/70 mt-2">
                            You must be signed in to view this page.
                        </p>

                        <div className="mt-6">
                            <Button
                                onClick={() => navigate("/welcome")}
                                color="PRIMARY"
                            >
                                Sign In
                            </Button>
                        </div>
                    </Card>
                </div>
            </main>
        )
    }

    return (
        <main className="text-text w-full">
            <div className="mx-auto w-full max-w-2xl px-6 py-12">
                {/* back button */}
                <button
                    onClick={() => navigate(-1)}
                    className="text-text/60 hover:text-text mb-6 flex cursor-pointer items-center gap-2 text-sm transition-colors"
                >
                    <ArrowLeft size={16} />
                    Back
                </button>

                <div className="bg-card border-card-border overflow-hidden rounded-2xl border shadow-sm">
                    {/* header */}
                    <div className="bg-primary/10 border-primary/20 border-b px-8 py-6">
                        <div className="flex items-center gap-4">
                            <div className="bg-secondary/20 flex h-12 w-12 items-center justify-center rounded-full">
                                <GraduationCap
                                    size={24}
                                    className="text-secondary"
                                />
                            </div>

                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">
                                    Become a TA
                                </h1>

                                <p className="text-text/60 text-sm">
                                    Help fellow students succeed
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* content */}
                    <div className="p-8">
                        <p className="text-text/80 leading-relaxed">
                            To apply to be a TA, please send an email from your
                            UMN email to{" "}
                            <a
                                href="mailto:ta@umn.app"
                                className="text-secondary font-semibold hover:underline"
                            >
                                ta@umn.app
                            </a>{" "}
                            with information on which class you're a TA for, and
                            we will approve within 48 hours.
                        </p>

                        {/* info cards */}
                        <div className="mt-8 grid gap-4 sm:grid-cols-2">
                            <div className="bg-background flex items-start gap-3 rounded-xl p-4">
                                <Mail
                                    size={20}
                                    className="text-secondary mt-0.5 flex-shrink-0"
                                />

                                <div>
                                    <p className="text-sm font-medium">
                                        Email required
                                    </p>

                                    <p className="text-text/60 mt-1 text-xs">
                                        Must be sent from your @umn.edu address
                                    </p>
                                </div>
                            </div>

                            <div className="bg-background flex items-start gap-3 rounded-xl p-4">
                                <Clock
                                    size={20}
                                    className="text-secondary mt-0.5 flex-shrink-0"
                                />

                                <div>
                                    <p className="text-sm font-medium">
                                        Quick approval
                                    </p>

                                    <p className="text-text/60 mt-1 text-xs">
                                        We'll review your request within 48
                                        hours
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* cta */}
                        <div className="mt-8">
                            <a
                                href="mailto:ta@umn.app?subject=TA Application"
                                className="block"
                            >
                                <Button color="INFO" className="w-full">
                                    <Mail size={18} />
                                    Send Application Email
                                </Button>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
