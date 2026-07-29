import {useRouteError} from "react-router";

/**
 * When there's an error
 *
 * @author AJ Kneisl
 */
export default function ErrorElement() {
    const error = useRouteError() as Error | undefined

    return (
        <div className="p-8 text-center">
            <h1 className="text-2xl font-bold text-error">
                Something went wrong
            </h1>

            <p className="mt-2 opacity-70">
                {error?.message || "An unexpected error occurred."}
            </p>
        </div>
    )
}
