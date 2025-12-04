import { useNavigate } from "react-router"
import { Button } from "@umnburrow/core"
import { useAtom } from "jotai"
import { problemModalOpen } from "@features/problem/problem.atom.ts"

/**
 * 404 page :)
 *
 * @author AJ Kneisl
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
        <main className="text-text w-full">
            <div className="mx-auto w-full max-w-2xl px-6 py-12">
                <div className="bg-card border-card-border relative overflow-hidden rounded-2xl border p-8 shadow-sm">
                    <img
                        src="/image/not_found.jpg"
                        className="mb-4 rounded-lg grayscale"
                        aria-hidden
                        draggable={false}
                        alt={"Screaming Gopher"}
                    />

                    <h1 className="text-2xl font-bold tracking-tight">
                        We couldn't find that page
                    </h1>

                    <p className="text-text/70 mt-2 text-sm">
                        It may have moved, or the link is incorrect.
                    </p>

                    <div className="mt-6 flex flex-wrap justify-center gap-4 md:justify-between">
                        <div className="flex flex-row gap-3">
                            <Button onClick={handleGoBack} color="SECONDARY">
                                Go back
                            </Button>
                            <Button onClick={handleHome} color="PRIMARY">
                                Home
                            </Button>
                        </div>

                        <Button
                            onClick={() => setProblemOpen(true)}
                            color="ERROR"
                        >
                            Report a problem
                        </Button>
                    </div>
                </div>
            </div>
        </main>
    )
}
