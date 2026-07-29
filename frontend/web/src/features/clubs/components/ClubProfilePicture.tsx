import { useMemo, useRef, useState } from "react"
import clsx from "clsx"
import { CDN_URL } from "@api/util.ts"
import { uploadClubPhoto } from "@features/clubs/clubs.api.ts"
import useClubRole from "@features/clubs/hooks/useClubRole.ts"
import toast from "react-hot-toast"

type ClubProfilePictureProps = {
    clubID: string
    displayName: string
    clubName: string
    size: "sm" | "md" | "lg"
}

export default function ClubProfilePicture({
    clubID,
    displayName,
    clubName,
    size = "lg",
}: ClubProfilePictureProps) {
    const { isAdmin: editable } = useClubRole(clubName)
    const [imageError, setImageError] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [showHover, setShowHover] = useState(false)
    const [cacheBust, setCacheBust] = useState(0)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const initials = useMemo(
        () =>
            displayName
                ? displayName
                      .split(" ")
                      .slice(0, 2)
                      .map((n) => n[0]?.toUpperCase())
                      .join("")
                : "?",
        [displayName]
    )

    const avatarUrl = useMemo(
        () => `${CDN_URL}/avatars/club/${clubID}/avatar${cacheBust ? `?v=${cacheBust}` : ""}`,
        [clubID, cacheBust]
    )

    const sizeClasses = useMemo(() => {
        return {
            container: clsx(
                size === "sm" ? "size-10 ring-1" :
                size === "md" ? "size-12 ring-2" :
                "size-24 ring-4"
            ),
            text: clsx(
                size === "sm" ? "text-sm" :
                size === "md" ? "text-md" :
                "text-2xl"
            ),
        }
    }, [size])

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        const validTypes = ["image/png", "image/jpeg", "image/gif", "image/webp"]
        if (!validTypes.includes(file.type)) {
            toast.error("Invalid file type. Please upload PNG, JPEG, GIF, or WebP.")
            return
        }

        if (file.size > 3 * 1024 * 1024) {
            toast.error("Image must be under 3 MB!")
            return
        }

        setUploading(true)
        try {
            await uploadClubPhoto(clubName, file)
            setImageError(false)
            setCacheBust(Date.now())
            toast.success("Club avatar updated!")
        } catch (error) {
            toast.error(typeof error === "string" ? error : "Failed to upload image")
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    return (
        <div className="relative">
            <div
                className={clsx(
                    "ring-offset-base-100 overflow-hidden rounded-full shadow ring-primary",
                    sizeClasses.container,
                    editable && "cursor-pointer"
                )}
                onMouseEnter={() => editable && setShowHover(true)}
                onMouseLeave={() => editable && setShowHover(false)}
                onClick={() => editable && fileInputRef.current?.click()}
            >
                {!imageError ? (
                    <img
                        src={avatarUrl}
                        alt={`${displayName} avatar`}
                        className="size-full object-cover"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div
                        className={clsx(
                            "flex size-full items-center justify-center bg-hero font-bold",
                            sizeClasses.text
                        )}
                    >
                        {initials}
                    </div>
                )}

                {editable && showHover && !uploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                        <svg
                            className={clsx(
                                "text-white",
                                size === "sm" ? "size-4" :
                                size === "md" ? "size-6" :
                                "size-8"
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

                {editable && uploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                        <div className="size-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                )}
            </div>

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
