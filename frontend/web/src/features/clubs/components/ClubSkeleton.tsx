import { Card } from "@umnburrow/core"

/**
 * The skeleton of a club.
 * @constructor
 */
export default function ClubSkeleton() {
    return (
        <main className="min-h-screen">
            <section className="relative isolate">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <Card className="order-first col-span-1 p-6 lg:col-span-3">
                            <div className="animate-pulse space-y-4">
                                <div className="h-8 w-3/4 rounded-lg bg-text/10" />
                                <div className="flex items-center gap-2">
                                    <div className="size-10 rounded-full bg-text/10" />
                                    <div className="h-4 w-48 rounded bg-text/10" />
                                </div>
                            </div>
                        </Card>
                        <div className="col-span-1 space-y-6 lg:col-span-2">
                            <Card className="p-6">
                                <div className="animate-pulse space-y-2">
                                    <div className="h-5 w-32 rounded bg-text/10" />
                                    <div className="h-4 w-full rounded bg-text/10" />
                                    <div className="h-4 w-3/4 rounded bg-text/10" />
                                </div>
                            </Card>
                        </div>
                        <div className="-order-1 col-span-1 space-y-6 md:order-2">
                            <Card className="p-6">
                                <div className="animate-pulse space-y-3">
                                    <div className="h-5 w-24 rounded bg-text/10" />
                                    {[1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-2"
                                        >
                                            <div className="size-10 rounded-full bg-text/10" />
                                            <div className="h-4 w-32 rounded bg-text/10" />
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}
