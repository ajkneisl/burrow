import { useRef, useState } from "react"
import { Flag, User, FileWarning } from "lucide-react"
import MeetingButton from "@features/burrows/controls/MeetingButton.tsx"
import { Dropdown, DropdownItem } from "@umnburrow/core"
import ReportBurrowModal from "@features/report/components/ReportBurrowModal.tsx"
import ReportUserModal from "@features/report/components/ReportUserModal.tsx"

/**
 * {@link ReportBurrow}
 */
type ReportBurrowProps = {
    burrowID: string
    burrowTitle: string
    authorID: string
    authorName: string
}

/**
 * Button with dropdown to report a Burrow or its author.
 *
 * @param burrowID The ID of the Burrow.
 * @param burrowTitle The title of the Burrow.
 * @param authorID The ID of the Burrow author.
 * @param authorName The display name of the author.
 *
 * @author AJ Kneisl
 */
export default function ReportBurrow({
    burrowID,
    burrowTitle,
    authorID,
    authorName
}: ReportBurrowProps) {
    const [dropdownOpen, setDropdownOpen] = useState(false)

    const [reportAuthorOpen, setReportAuthorOpen] = useState(false)
    const [reportBurrowOpen, setReportBurrowOpen] = useState(false)

    const buttonRef = useRef<HTMLButtonElement | null>(null)

    return (
        <div className="relative inline-block text-left">
            <MeetingButton
                onClick={() => setDropdownOpen((v) => !v)}
                ref={buttonRef}
            >
                <Flag className="size-5" />
            </MeetingButton>

            {/* options dropdown */}
            <Dropdown
                open={dropdownOpen}
                onClose={() => setDropdownOpen(false)}
                btnRef={buttonRef}
                align="end"
                className="top-2.5 -left-8"
            >
                <DropdownItem
                    label="Report Author"
                    onSelect={() => {
                        setReportAuthorOpen(true)
                        setDropdownOpen(false)
                    }}
                    rightIcon={<User className="size-4" />}
                />

                <DropdownItem
                    label="Report Burrow"
                    onSelect={() => {
                        setReportBurrowOpen(true)
                        setDropdownOpen(false)
                    }}
                    rightIcon={<FileWarning className="size-4" />}
                />
            </Dropdown>

            {/* report author */}
            <ReportUserModal
                open={reportAuthorOpen}
                onClose={() => setReportAuthorOpen(false)}
                userID={authorID}
                username={authorName}
            />

            {/* report burrow */}
            <ReportBurrowModal
                open={reportBurrowOpen}
                onClose={() => setReportBurrowOpen(false)}
                burrowID={burrowID}
                burrowTitle={burrowTitle}
            />
        </div>
    )
}
