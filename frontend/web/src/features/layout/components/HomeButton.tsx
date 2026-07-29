import { useNavigate } from "react-router"
import HeaderButton from "@features/layout/components/HeaderButton.tsx"
import { HomeIcon } from "lucide-react"

/**
 * The back-button on the header.
 */
export default function HomeButton() {
    const nav = useNavigate()

    return (
        <HeaderButton
            type="button"
            aria-haspopup="menu"
            aria-label="Go back"
            onClick={() => nav("/")}
            icon={<HomeIcon className="size-5" />}
        />
    )
}
