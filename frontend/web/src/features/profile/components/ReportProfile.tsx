import { useRef, useState } from "react"
import { Flag, User, UserRoundX } from "lucide-react"
import { Button, Dropdown, DropdownItem } from "@umnburrow/core"
import ReportUserModal from "@features/report/components/ReportUserModal.tsx"
import BlockUserModal from "@features/profile/components/BlockUserModal.tsx";

/**
 * {@link ReportProfile}
 */
type ReportProfileProps = {
    userID: string
    username: string
}

/**
 * Button with dropdown to report a profile
 *
 * @param userID The ID of the user.
 * @param username The name of the user.
 *
 * @author AJ Kneisl
 */
export default function ReportProfile({
    userID,
    username
}: ReportProfileProps) {
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const [reportUserOpen, setReportUserOpen] = useState(false)
    const [blockUserOpen, setBlockUserOpen] = useState(false)

    const buttonRef = useRef<HTMLButtonElement | null>(null)

    return (
        <div className="relative inline-block text-left">
            <Button
                aria-label="More options"
                onClick={() => setDropdownOpen((dropdown) => !dropdown)}
            >
                <Flag className="size-5" />
            </Button>

            {/* options dropdown */}
            <Dropdown
                open={dropdownOpen}
                onClose={() => setDropdownOpen(false)}
                btnRef={buttonRef}
                align="end"
                className="top-2.5"
            >
                <DropdownItem
                    label="Report User"
                    onSelect={() => {
                        setReportUserOpen(true)
                        setDropdownOpen(false)
                    }}
                    rightIcon={<User className="size-4" />}
                />

                <DropdownItem
                    label="Block User"
                    onSelect={() => {
                        setBlockUserOpen(true)
                        setDropdownOpen(false)
                    }}
                    rightIcon={<UserRoundX className="size-4" />}
                />
            </Dropdown>

            {/* report user */}
            <ReportUserModal
                open={reportUserOpen}
                onClose={() => setReportUserOpen(false)}
                userID={userID}
                username={username}
            />

            {/* block user */}
            <BlockUserModal
                open={blockUserOpen}
                handleClose={() => setBlockUserOpen(false)}
                userID={userID}
                username={username}
            />
        </div>
    )
}
