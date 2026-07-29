import { useEffect, useRef, useState } from "react"
import type { Burrow } from "@features/burrows/burrows.types.tsx"
import { QRCodeSVG } from "qrcode.react"
import MeetingButton from "@features/burrows/controls/MeetingButton.tsx"
import { Dropdown, DropdownItem, Modal } from "@umnburrow/core"
import { Upload, QrCode } from "lucide-react"

/**
 * {@link ShareMeeting}
 */
type ShareMeetingProps = {
    meeting: Burrow
}

/**
 * The button to share a meeting.
 *
 * @param meeting The meeting to share.
 *
 * @author AJ Kneisl
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
                    <Upload width="20" height="20" />
                </MeetingButton>

                <Dropdown
                    open={open}
                    onClose={() => setOpen(false)}
                    btnRef={buttonRef}
                    align="start"
                >
                    {/* show qr code */}
                        <DropdownItem
                            label="Show QR code"
                            onSelect={() => {
                                setQrOpen(true)
                                setOpen(false)
                            }}
                            rightIcon={<QrCode width="18" height="18" />}
                        />

                        {/* native share */}
                        <DropdownItem
                            label="Share via…"
                            onSelect={() => {
                                handleNativeShare()
                                setOpen(false)
                            }}
                            rightIcon={<Upload width="18" height="18" />}
                        />
                </Dropdown>
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
                            src: "/image/burrow.png",
                            height: 24,
                            width: 24,
                            excavate: true
                        }}
                    />
                    <p className="mt-3 max-w-[32ch] text-center text-xs break-words text-text/70">
                        {shareData.url}
                    </p>
                </div>
            </Modal>
        </div>
    )
}
