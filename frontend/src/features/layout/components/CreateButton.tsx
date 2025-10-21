import { motion } from "framer-motion"
import { useAtom } from "jotai"
import { studyGroupModal } from "@features/create/api/modal.atom.ts"

/**
 * The `Create Burrow` button.
 */
export default function CreateButton() {
    const [, setModalOpen] = useAtom(studyGroupModal)

    return (
        <motion.button
            onClick={() => setModalOpen(true)}
            className="cursor-pointer inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-medium text-neutral-900 hover:bg-secondary-hover transition-colors shadow-sm"
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.03 }}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-4 w-4"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v16m8-8H4"
                />
            </svg>

            <span className="md:block hidden">Create Burrow</span>
        </motion.button>
    )
}
