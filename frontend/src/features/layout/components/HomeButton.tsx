import { useNavigate } from "react-router"
import HeaderButton from "@features/layout/components/HeaderButton.tsx"

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
            icon={
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <path d="M3 9.5L12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V9.5z" />
                </svg>
            }
        />
    )
}
