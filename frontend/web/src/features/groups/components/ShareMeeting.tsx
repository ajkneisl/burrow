import { useEffect, useRef, useState } from "react"
import type { GroupMeeting } from "@features/groups/groups.types.ts"
import { QRCodeSVG } from "qrcode.react"
import MeetingButton from "@features/groups/components/MeetingButton.tsx"
import { Dropdown, DropdownItem, Modal } from "@umnburrow/core"

/**
 * {@link ShareMeeting}
 */
type ShareMeetingProps = {
    meeting: GroupMeeting
}

/**
 * The button to share a meeting.
 *
 * @param meeting The meeting to share.
 * @constructor
 */
export default function ShareMeeting({ meeting }: ShareMeetingProps) {
    const [qrOpen, setQrOpen] = useState(false)

    const [open, setOpen] = useState(false)
    const buttonRef = useRef<HTMLButtonElement | null>(null)

    const shareData = {
        title: meeting.title,
        text: meeting.description ?? meeting.title,
        url: `https://umn.app/${meeting.id}`
    } as ShareData

    useEffect(() => {
        function onEsc(e: KeyboardEvent) {
            if (e.key === "Escape") {
                setQrOpen(false)
            }
        }
        document.addEventListener("keydown", onEsc)
        return () => {
            document.removeEventListener("keydown", onEsc)
        }
    }, [qrOpen])

    // the regular share button
    async function handleNativeShare() {
        try {
            if (navigator.share) {
                await navigator.share(shareData)
            } else {
                await navigator.clipboard.writeText(
                    shareData.url ?? "https://umn.app"
                )
                alert("Link copied to clipboard.")
            }
        } catch {
            /* empty */
        } finally {
            // no menuOpen to close anymore
        }
    }

    return (
        <div className="relative inline-block text-left">
            <div className="relative inline-block text-left">
                <MeetingButton
                    onClick={() => setOpen((v) => !v)}
                    ref={buttonRef}
                >
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        role="img"
                    >
                        <path d="M12 3v11" />
                        <path d="M8.5 6.5L12 3l3.5 3.5" />
                        <path d="M5 13v5a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-5" />
                    </svg>
                </MeetingButton>

                <div className="absolute left-56 top-full">
                    <Dropdown
                        className="-mt-3"
                        open={open}
                        onClose={() => setOpen(false)}
                        btnRef={buttonRef}
                    >
                        {/* show qr code */}
                        <DropdownItem
                            label="Show QR code"
                            onSelect={() => {
                                setQrOpen(true)
                                setOpen(false)
                            }}
                            rightIcon={
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.6"
                                >
                                    <path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3z" />
                                    <path d="M17 13h4v4h-4zM15 19h2M19 21v-2" />
                                </svg>
                            }
                        />

                        {/* native share */}
                        <DropdownItem
                            label="Share via…"
                            onSelect={() => {
                                handleNativeShare()
                                setOpen(false)
                            }}
                            rightIcon={
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.6"
                                >
                                    <path d="M12 3v11" />
                                    <path d="M8.5 6.5L12 3l3.5 3.5" />
                                    <path d="M5 13v5a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-5" />
                                </svg>
                            }
                        />
                    </Dropdown>
                </div>
            </div>

            {/* QR Code modal */}
            <Modal
                open={qrOpen}
                onClose={() => setQrOpen(false)}
                title="QR Code"
                widthClass={"max-w-sm"}
            >
                <div className="flex flex-col items-center">
                    <QRCodeSVG
                        value={shareData.url ?? "https://umn.app"}
                        height={256}
                        width={256}
                        imageSettings={{
                            src: "/burrow.png",
                            height: 24,
                            width: 24,
                            excavate: true
                        }}
                    />
                    <p className="mt-3 max-w-[32ch] break-words text-center text-xs text-text/70">
                        {shareData.url}
                    </p>
                </div>
            </Modal>
        </div>
    )
}
