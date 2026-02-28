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
                                <div className="bg-text/10 h-8 w-3/4 rounded-lg" />
                                <div className="flex items-center gap-2">
                                    <div className="bg-text/10 h-10 w-10 rounded-full" />
                                    <div className="bg-text/10 h-4 w-48 rounded" />
                                </div>
                            </div>
                        </Card>
                        <div className="col-span-1 space-y-6 lg:col-span-2">
                            <Card className="p-6">
                                <div className="animate-pulse space-y-2">
                                    <div className="bg-text/10 h-5 w-32 rounded" />
                                    <div className="bg-text/10 h-4 w-full rounded" />
                                    <div className="bg-text/10 h-4 w-3/4 rounded" />
                                </div>
                            </Card>
                        </div>
                        <div className="order-[-1] col-span-1 space-y-6 md:order-2">
                            <Card className="p-6">
                                <div className="animate-pulse space-y-3">
                                    <div className="bg-text/10 h-5 w-24 rounded" />
                                    {[1, 2, 3].map((i) => (
                                        <div
                                            key={i}
                                            className="flex items-center gap-2"
                                        >
                                            <div className="bg-text/10 h-10 w-10 rounded-full" />
                                            <div className="bg-text/10 h-4 w-32 rounded" />
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
