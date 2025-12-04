import { useMemo, useState, useRef, useEffect } from "react"
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
    size: "sm" | "ksm" | "md" | "lg" | "responsive"
    editable?: boolean
    onUploadSuccess?: () => void
    isOnline?: boolean
}

/**
 * A profile picture. If they don't have one, default to their initials.
 * @param name The name of the user.
 * @param userID The ID of the user. Used to fetch the profile picture from MinIO.
 * @param size The size of the picture. Use "responsive" for sm->md->lg breakpoints.
 * @param editable If the picture should be editable. This is on a user's profile.
 * @param onUploadSuccess When the upload succeeds.
 * @param isOnline If defined, shows an online/offline indicator.
 * @constructor
 */
export default function ProfilePicture({
    name,
    userID,
    size = "lg",
    editable = false,
    onUploadSuccess,
    isOnline
}: ProfilePictureProps) {
    const [imageError, setImageError] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [showHover, setShowHover] = useState(false)
    const [isHovering, setIsHoveringImage] = useState(false)
    const [isGif, setIsGif] = useState(false)
    const [staticImageData, setStaticImageData] = useState<ImageData | null>(
        null
    )
    const fileInputRef = useRef<HTMLInputElement>(null)
    const staticCanvasRef = useRef<HTMLCanvasElement>(null)
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

    // Base avatar URL
    const avatarUrl = useMemo(
        () => `${CDN_URL}/avatars/user/${userID}/avatar`,
        [userID]
    )

    // Check if image is a GIF and extract first frame
    useEffect(() => {
        const checkAndProcessGif = async () => {
            try {
                const response = await fetch(avatarUrl, { method: "HEAD" })
                const contentType = response.headers.get("content-type")
                const gifDetected = contentType === "image/gif"
                setIsGif(gifDetected)

                // If it's a GIF, load it to extract the first frame
                if (gifDetected) {
                    const img = new Image()
                    img.crossOrigin = "anonymous"
                    img.onload = () => {
                        // Create a temporary canvas to extract image data
                        const tempCanvas = document.createElement("canvas")
                        tempCanvas.width = img.naturalWidth
                        tempCanvas.height = img.naturalHeight
                        const ctx = tempCanvas.getContext("2d")
                        if (ctx) {
                            ctx.drawImage(img, 0, 0)
                            // Store the image data for later use
                            const imageData = ctx.getImageData(
                                0,
                                0,
                                tempCanvas.width,
                                tempCanvas.height
                            )
                            setStaticImageData(imageData)
                        }
                    }
                    img.src = avatarUrl
                }
            } catch {
                setIsGif(false)
            }
        }

        checkAndProcessGif()
    }, [avatarUrl])

    // Draw the static image data to canvas when available
    useEffect(() => {
        if (staticImageData && staticCanvasRef.current) {
            const canvas = staticCanvasRef.current
            canvas.width = staticImageData.width
            canvas.height = staticImageData.height
            const ctx = canvas.getContext("2d")
            if (ctx) {
                ctx.putImageData(staticImageData, 0, 0)
            }
        }
    }, [staticImageData])

    const getResponsiveClasses = useMemo(() => {
        const isResponsive = size === "responsive"

        return {
            container: clsx(
                isResponsive ? "h-8 w-8 ring-1 md:h-12 md:w-12 md:ring-2 lg:h-24 lg:w-24 lg:ring-4" :
                size === "sm" ? "h-8 w-8 ring-1" :
                size === "ksm" ? "h-10 w-10 ring-1" :
                size === "md" ? "h-12 w-12 ring-2" :
                "h-24 w-24 ring-4"
            ),
            text: clsx(
                isResponsive ? "md:text-md text-sm lg:text-2xl" :
                size === "sm" || size === "ksm" ? "text-sm" :
                size === "md" ? "text-md" :
                "text-2xl"
            ),
            indicator: clsx(
                isResponsive ? "h-2 w-2 md:h-3 md:w-3 lg:h-4 lg:w-4" :
                size === "sm" || size === "ksm" ? "h-2 w-2" :
                size === "md" ? "h-3 w-3" :
                "h-4 w-4"
            )
        }
    }, [size])

    const handleFileSelect = async (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0]
        if (!file || !token) return

        // file type
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
                    getResponsiveClasses.container,
                    editable && "cursor-pointer"
                )}
                onMouseEnter={() => {
                    if (editable) setShowHover(true)
                    setIsHoveringImage(true)
                }}
                onMouseLeave={() => {
                    if (editable) setShowHover(false)
                    setIsHoveringImage(false)
                }}
                onClick={() => editable && handleEditClick()}
            >
                {!imageError ? (
                    <>
                        {/* Show canvas (first frame) when GIF is not hovered */}
                        {isGif && (
                            <canvas
                                ref={staticCanvasRef}
                                className={clsx(
                                    "h-full w-full object-cover",
                                    isHovering && "hidden",
                                    !isHovering &&
                                        "group-hover:hidden hover:hidden"
                                )}
                            />
                        )}

                        {/* Show animated GIF when hovering or not a GIF */}
                        <img
                            src={avatarUrl}
                            alt={`${name}'s profile picture`}
                            className={clsx(
                                "h-full w-full object-cover",
                                isGif && "hidden group-hover:block hover:block",
                                isHovering && isGif && "!block"
                            )}
                            onError={() => setImageError(true)}
                        />
                    </>
                ) : (
                    <div
                        className={clsx(
                            "bg-hero flex h-full w-full items-center justify-center font-bold",
                            getResponsiveClasses.text
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
                                size === "sm"
                                    ? "h-4 w-4"
                                    : size === "md"
                                      ? "h-6 w-6"
                                      : "h-8 w-8"
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

            {/* Online/Offline indicator */}
            {isOnline !== undefined && (
                <div
                    className={clsx(
                        "absolute bottom-0 right-0 rounded-full border-2 border-card",
                        getResponsiveClasses.indicator,
                        isOnline ? "bg-success" : "bg-text/20"
                    )}
                    title={isOnline ? "Online" : "Offline"}
                />
            )}
        </div>
    )
}
