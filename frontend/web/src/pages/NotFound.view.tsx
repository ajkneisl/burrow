import { useNavigate } from "react-router"
import { Button } from "@umnburrow/core"
import { useAtom } from "jotai"
import { problemModalOpen } from "@features/problem/problem.atom.ts"

/**
 * 404 – Page not found (simplified, Amazon-inspired)
 */
export default function NotFound() {
    const navigate = useNavigate()
    const [, setProblemOpen] = useAtom(problemModalOpen)

    function handleGoBack() {
        if (window.history.length > 1) navigate(-1)
        else navigate("/", { replace: true })
    }

    function handleHome() {
        navigate("/")
    }

    return (
        <main className="w-full text-text">
            <div className="mx-auto w-full max-w-2xl px-6 py-12">
                <div className="relative overflow-hidden bg-card rounded-2xl border border-card-border p-8 shadow-sm">
                    {/* Watermark gopher behind content */}
                    <img
                        src="/not_found.jpg"
                        className="rounded-lg mb-4 grayscale"
                        aria-hidden
                        draggable={false}
                    />

                    <h1 className="text-2xl font-bold tracking-tight">
                        We couldn't find that page
                    </h1>
                    <p className="mt-2 text-sm text-black/70 dark:text-white/70">
                        It may have moved, or the link is incorrect.
                    </p>

                    <div className="mt-6 gap-4 flex flex-wrap md:justify-between justify-center">
                        <div className="flex flex-row gap-3">
                            <Button onClick={handleGoBack} color="SECONDARY">
                                Go back
                            </Button>
                            <Button onClick={handleHome} color="PRIMARY">
                                Home
                            </Button>
                        </div>

                        <Button onClick={() => setProblemOpen(true)} color="ERROR">
                            Report a problem
                        </Button>
                    </div>
                </div>
            </div>
        </main>
    )
}
