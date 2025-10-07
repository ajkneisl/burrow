import { motion } from "framer-motion"
import { useNavigate } from "react-router"

/**
 * The back-button on the header.
 */
export default function BackButton() {
    const nav = useNavigate()

    return (
        <motion.button
            type="button"
            aria-haspopup="menu"
            aria-label="Go back"
            onClick={() => nav(-1)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-secondary focus-visible:ring-offset-transparent"
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.03 }}
            transition={{
                type: "spring",
                stiffness: 600,
                damping: 30
            }}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                width="20"
                height="20"
            >
                <path
                    fillRule="evenodd"
                    d="M21 12a.75.75 0 0 1-.75.75H6.56l5.47 5.47a.75.75 0 1 1-1.06 1.06l-6.75-6.75a.75.75 0 0 1 0-1.06l6.75-6.75a.75.75 0 1 1 1.06 1.06L6.56 11.25H20.25A.75.75 0 0 1 21 12z"
                    clipRule="evenodd"
                />
            </svg>
        </motion.button>
    )
}
