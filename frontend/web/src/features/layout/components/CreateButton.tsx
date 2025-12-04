import { motion, AnimatePresence, type Variants } from "framer-motion"
import { useAtom } from "jotai"
import { createBurrowModal } from "@features/burrows/create/create.atom.ts"
import React, { useEffect, useRef, useState, useCallback } from "react"
import toast from "react-hot-toast"
import clsx from "clsx"
import { BookOpen, FolderKanban, PartyPopper, Users, Plus } from "lucide-react"

/**
 * The `Create Burrow`.
 *
 * @author AJ Kneisl
 */
export default function CreateButton() {
    const [, setModalOpen] = useAtom(createBurrowModal)
    const [open, setOpen] = useState(false)

    const buttonRef = useRef<HTMLButtonElement | null>(null)
    const menuRef = useRef<HTMLDivElement | null>(null)
    const [focusIndex, setFocusIndex] = useState(0)

    const options = [
        {
            label: "Study Session",
            value: "study",
            desc: "Create a study group",
            icon: <BookOpen className="text-success h-5 w-5" />,
            onClick: () => setModalOpen("STUDY")
        },
        {
            label: "Group Project",
            value: "project",
            desc: "Collaborate with classmates on projects",
            icon: <FolderKanban className="text-error h-5 w-5" />,
            onClick: () => setModalOpen("PROJECT")
        },
        {
            label: "Event Meeting",
            value: "event",
            desc: "Plan or host an event",
            icon: <PartyPopper className="text-secondary h-5 w-5" />,
            onClick: () => setModalOpen("EVENT")
        },
        {
            label: "Club Meeting",
            value: "club",
            desc: "Meet with your club",
            icon: <Users className="text-info h-5 w-5" />,
            onClick: () => toast.error("this is coming soon :)")
        }
    ]

    const closeMenu = useCallback(() => {
        setOpen(false)
        setFocusIndex(0)
        buttonRef.current?.focus()
    }, [])

    // Click away handler
    useEffect(() => {
        if (!open) return
        const onDocClick = (e: MouseEvent) => {
            const t = e.target as Node
            if (
                !menuRef.current?.contains(t) &&
                !buttonRef.current?.contains(t)
            ) {
                closeMenu()
            }
        }
        const onEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeMenu()
        }
        document.addEventListener("mousedown", onDocClick)
        document.addEventListener("keydown", onEsc)
        return () => {
            document.removeEventListener("mousedown", onDocClick)
            document.removeEventListener("keydown", onEsc)
        }
    }, [open, closeMenu])

    function onButtonKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
        if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            setOpen(true)
            // focus first item next tick
            requestAnimationFrame(() => setFocusIndex(0))
        }
    }

    function onMenuKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
        if (e.key === "ArrowDown") {
            e.preventDefault()
            setFocusIndex((i) => (i + 1) % options.length)
        } else if (e.key === "ArrowUp") {
            e.preventDefault()
            setFocusIndex((i) => (i - 1 + options.length) % options.length)
        } else if (e.key === "Home") {
            e.preventDefault()
            setFocusIndex(0)
        } else if (e.key === "End") {
            e.preventDefault()
            setFocusIndex(options.length - 1)
        }
    }

    // Responsive: detect desktop for animation direction and panel placement
    const [isDesktop, setIsDesktop] = useState(false)
    useEffect(() => {
        const mq = window.matchMedia("(min-width: 768px)")
        const update = () => setIsDesktop(mq.matches)
        update()

        mq.addEventListener("change", update)
        return () => mq.removeEventListener("change", update)
    }, [])

    // Motion variants for the dropdown panel and items
    const panel: Variants = {
        hidden: { opacity: 0, y: isDesktop ? -6 : 6, scale: 0.98 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: "spring",
                stiffness: 420,
                damping: 28,
                mass: 0.8,
                staggerChildren: 0.035
            }
        },
        exit: {
            opacity: 0,
            y: isDesktop ? -6 : 6,
            scale: 0.98,
            transition: { duration: 0.12 }
        }
    }
    const item = {
        hidden: { opacity: 0, y: -2 },
        visible: { opacity: 1, y: 0 }
    }

    return (
        <div className="fixed right-6 bottom-6 z-50 md:relative md:right-0 md:bottom-0 md:inline-block md:text-left">
            <motion.button
                ref={buttonRef}
                type="button"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls="create-menu"
                onClick={() => setOpen((v) => !v)}
                onKeyDown={onButtonKeyDown}
                className="bg-secondary hover:bg-secondary-hover inline-flex cursor-pointer items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-neutral-900 shadow-sm transition-colors"
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.03 }}
            >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span className="hidden md:block">Create</span>
            </motion.button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        id="create-menu"
                        role="menu"
                        aria-label="Create options"
                        ref={menuRef}
                        variants={panel}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onKeyDown={onMenuKeyDown}
                        className={clsx(
                            "absolute right-0 w-64 rounded-2xl",
                            "bottom-full mb-2 origin-bottom-right",
                            "md:top-full md:bottom-auto md:mt-2 md:mb-0 md:origin-top-right",
                            "border-primary/20 bg-background overflow-hidden border shadow-xl ring-1 ring-black/5 focus:outline-none"
                        )}
                    >
                        <ul className="p-1.5" role="none">
                            {options.map((opt, idx) => {
                                return (
                                    <motion.li
                                        key={opt.value}
                                        variants={item}
                                        role="none"
                                    >
                                        <button
                                            role="menuitem"
                                            tabIndex={
                                                focusIndex === idx ? 0 : -1
                                            }
                                            onMouseEnter={() =>
                                                setFocusIndex(idx)
                                            }
                                            onClick={() => {
                                                closeMenu()
                                                opt.onClick()
                                            }}
                                            className="group text-text hover:bg-card focus-visible:ring-primary flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none md:text-base"
                                        >
                                            {opt.icon}
                                            <span className="flex-1 text-left">
                                                <span className="block font-medium">
                                                    {opt.label}
                                                </span>
                                                <span className="text-text/40 block text-xs">
                                                    {opt.desc}
                                                </span>
                                            </span>
                                        </button>
                                    </motion.li>
                                )
                            })}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
