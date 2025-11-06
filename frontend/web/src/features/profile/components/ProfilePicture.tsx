import { useMemo, useState, useRef } from "react"
import clsx from "clsx"
import { CDN_URL, BASE_URL } from "@api/util.ts"
import useToken from "@features/auth/hooks/useToken"
import toast from "react-hot-toast"

/**
 * {@see ProfilePicture}
 */
type ProfilePictureProps = {
    name: string
    userID: string
    size: "sm" | "md" | "lg"
    editable?: boolean
    onUploadSuccess?: () => void
}

/**
 * A profile picture. If they don't have one, default to their initials.
 * @param name The name of the user.
 * @param userID The ID of the user. Used to fetch the profile picture from MinIO.
 * @param size The size of the picture.
 * @param editable If the picture should be editable. This is on a user's profile.
 * @param onUploadSuccess When the upload succeeds.
 * @constructor
 */
export default function ProfilePicture({
    name,
    userID,
    size = "lg",
    editable = false,
    onUploadSuccess
}: ProfilePictureProps) {
    const [imageError, setImageError] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [showHover, setShowHover] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const token = useToken()

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

    const avatarUrl = useMemo(
        () => `${CDN_URL}/avatars/user/${userID}/avatar`,
        [userID]
    )

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

    const handleFileSelect = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0]
        if (!file || !token) return

        // file type
        const validTypes = ["image/png", "image/jpeg", "image/gif", "image/webp"]

        if (!validTypes.includes(file.type)) {
            toast.error("Invalid file type. Please upload PNG, JPEG, GIF, or WebP.")
            return
        }

        // image size
        const maxSize = 3 * 1024 * 1024
        if (file.size > maxSize) {
            toast.error("Image must be under 3 MB!")
            return
        }

        setUploading(true)

        try {
            const response = await fetch(`${BASE_URL}/user/photo`, {
                method: "POST",
                headers: {
                    "Content-Type": file.type,
                    Authorization: `Bearer ${token}`
                },
                body: file
            })

            if (!response.ok) {
                const error = await response.json()
                toast.error(error.message || "Failed to upload image")
                return
            }

            // clear the image error to reload the image
            setImageError(false)
            toast.success("Profile picture updated!")
            onUploadSuccess?.()
        } catch (error) {
            toast.error("Failed to upload image")
        } finally {
            setUploading(false)
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
    }

    const handleEditClick = () => {
        fileInputRef.current?.click()
    }

    return (
        <div className="relative">
            <div
                className={clsx(
                    "ring-primary ring-offset-base-100 overflow-hidden rounded-full shadow",
                    sizeStyle,
                    editable && "cursor-pointer"
                )}
                onMouseEnter={() => editable && setShowHover(true)}
                onMouseLeave={() => editable && setShowHover(false)}
                onClick={() => editable && handleEditClick()}
            >
                {!imageError ? (
                    <img
                        src={avatarUrl}
                        alt={`${name}'s profile picture`}
                        className="h-full w-full object-cover"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div
                        className={clsx(
                            "bg-hero flex h-full w-full items-center justify-center font-bold",
                            textStyle
                        )}
                    >
                        {initials}
                    </div>
                )}

                {/* edit overlay */}
                {editable && showHover && !uploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 transition-opacity">
                        <svg
                            className={clsx(
                                "text-white",
                                size === "sm" ? "h-4 w-4" : size === "md" ? "h-6 w-6" : "h-8 w-8"
                            )}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                        </svg>
                    </div>
                )}

                {/* uploading */}
                {editable && uploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                        <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
                    </div>
                )}
            </div>

            {/* file input */}
            {editable && (
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    className="hidden"
                    onChange={handleFileSelect}
                />
            )}
        </div>
    )
}
