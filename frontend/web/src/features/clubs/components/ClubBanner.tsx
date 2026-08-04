import { uploadClubBanner } from "@umnburrow/core/api"
import { useRef, useState, useMemo } from "react"
import clsx from "clsx"
import { Camera } from "lucide-react"
import { CDN_URL } from "@api/util.ts"
import useToken from "@features/auth/hooks/useToken.ts"
import useClubRole from "@features/clubs/hooks/useClubRole.ts"
import toast from "react-hot-toast"

/**
 * {@link ClubBanner}
 */
type ClubBannerProps = {
    clubID: string
    clubName: string
}

/**
 * A club's banner.
 *
 * @param clubID The ID of the club.
 * @param clubName The name of the club.
 *
 * @author AJ Kneisl
 */
export default function ClubBanner({
    clubID,
    clubName,
}: ClubBannerProps) {
    const { isAdmin: editable } = useClubRole(clubName)
    const [imageError, setImageError] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [showHover, setShowHover] = useState(false)
    const [cacheBust, setCacheBust] = useState(0)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const token = useToken()

    const bannerUrl = useMemo(
        () =>
            `${CDN_URL}/avatars/club/${clubID}/banner${cacheBust ? `?v=${cacheBust}` : ""}`,
        [clubID, cacheBust]
    )

    const handleFileSelect = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0]
        if (!file || !token) return

        const validTypes = [
            "image/png",
            "image/jpeg",
            "image/gif",
            "image/webp"
        ]
        if (!validTypes.includes(file.type)) {
            toast.error(
                "Invalid file type. Please upload PNG, JPEG, GIF, or WebP."
            )
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Banner must be under 5 MB!")
            return
        }

        setUploading(true)
        try {
            await uploadClubBanner(clubName, file, file.type)
            setImageError(false)
            setCacheBust(Date.now())
            toast.success("Club banner updated!")
        } catch (error) {
            toast.error(
                typeof error === "string" ? error : "Failed to upload banner"
            )
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    return (
        <div
            className={clsx(
                "relative h-32 w-full overflow-hidden rounded-t-2xl md:h-48",
                editable && "cursor-pointer"
            )}
            onMouseEnter={() => editable && setShowHover(true)}
            onMouseLeave={() => editable && setShowHover(false)}
            onClick={() => editable && fileInputRef.current?.click()}
        >
            {!imageError ? (
                <img
                    src={bannerUrl}
                    alt="Club banner"
                    className="size-full object-cover"
                    onError={() => setImageError(true)}
                />
            ) : (
                <div className="size-full bg-gradient-to-br from-primary/20 to-primary/5" />
            )}

            {editable && showHover && !uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity">
                    <div className="flex flex-col items-center gap-1 text-white">
                        <Camera className="size-6" />
                        <span className="text-xs font-medium">
                            Change Banner
                        </span>
                    </div>
                </div>
            )}

            {editable && uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
            )}

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
