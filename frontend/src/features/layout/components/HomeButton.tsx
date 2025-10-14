import { motion } from "framer-motion"
import { useNavigate } from "react-router"

/**
 * The back-button on the header.
 */
export default function HomeButton() {
    const nav = useNavigate()

    return (
        <motion.button
            type="button"
            aria-haspopup="menu"
            aria-label="Go back"
            onClick={() => nav("/")}
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
                width={24}
                height={24}
                fill="currentColor"
                aria-label="House Icon"
            >
                <path d="M12,2.099609L1,12h3v9h6v-6h4v6h6v-9h3L12,2.099609Z" />
            </svg>
        </motion.button>
    )
}
