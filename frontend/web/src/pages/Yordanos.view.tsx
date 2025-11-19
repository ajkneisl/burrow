import { useState } from "react"
import { Button, Card } from "@umnburrow/core"
import clsx from "clsx"
import {get} from "@api/api.ts";

/**
 * Debug utilities
 *
 * @author AJ Kneisl
 */
export default function Yordanos() {
    const [spin, setSpin] = useState(false)

    return (
        <div className="m-4 flex w-full flex-col items-center justify-center">
            <Card>
                <img
                    src="/image/yord_gopher.png"
                    width={256}
                    alt="A gopher of Yordanos stature."
                    className={clsx("cursor-pointer", spin && "animate-spin")}
                    onClick={() => setSpin((prev) => !prev)}
                    onAnimationEnd={() => setSpin(false)}
                />

                <p className="figtree -mt-16 text-center text-lg">
                    He's been expecting you.
                </p>

                <div className="mt-4 flex flex-col gap-2">
                    <h2 className="italic">Debug Tools</h2>
                    <Button
                        color="SUCCESS"
                        onClick={() => get(`/debug/notification`)}
                    >
                        Request Notification
                    </Button>
                </div>
            </Card>
        </div>
    )
}
