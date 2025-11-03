import { useMemo } from "react"
import clsx from "clsx"

/**
 * {@see ProfilePicture}
 */
type ProfilePictureProps = {
    name: string
    userID: string
    size: "sm" | "md" | "lg"
}

/**
 * A profile picture. If they don't have one, default to their
 * @param name The name of the user.
 * @param userID The ID of the user. This will eventually be used to find the profile picture.
 * @param size The size of the picture.
 * @constructor
 */
export default function ProfilePicture({
    name,
    userID,
    size = "lg"
}: ProfilePictureProps) {
    const initials = useMemo(
        () =>
            name
                ? name
                      .split(" ")
                      .slice(0, 2)
                      .map((n) => n[0]?.toUpperCase())
                      .join("")
                : "?",
        [name]
    )

    console.log(userID)

    const [sizeStyle, textStyle] = useMemo(() => {
        switch (size) {
            case "sm":
                return ["h-8 w-8 ring-1", "text-sm"]
            case "md":
                return ["h-12 w-12 ring-2", "text-md"]
            case "lg":
                return ["h-24 w-24 ring-4", "text-2xl"]
        }
    }, [size])

    return (
        <div
            className={clsx(
                "ring-primary ring-offset-base-100 overflow-hidden rounded-full shadow",
                sizeStyle
            )}
        >
            <div
                className={clsx(
                    "flex h-full w-full items-center justify-center bg-hero font-bold",
                    textStyle
                )}
            >
                {initials}
            </div>
        </div>
    )
}
