import { motion, AnimatePresence, type Variants } from "framer-motion"
import { useAtom } from "jotai"
import { studyGroupModal } from "@features/burrows/create/create.atom.ts"
import React, { useEffect, useRef, useState, useCallback } from "react"
import toast from "react-hot-toast"
import clsx from "clsx"

/**
 * The `Create Burrow` button with a unique dropdown.
 */
export default function CreateButton() {
    const [, setModalOpen] = useAtom(studyGroupModal)
    const [open, setOpen] = useState(false)

    const buttonRef = useRef<HTMLButtonElement | null>(null)
    const menuRef = useRef<HTMLDivElement | null>(null)
    const [focusIndex, setFocusIndex] = useState(0)

    const options = [
        {
            label: "Study Session",
            value: "study",
            desc: "Create a study group",
            icon: (
                <svg className="h-5 w-5 text-secondary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m8-6H4" />
                </svg>
            ),
            onClick: () => setModalOpen(true),
        },
        {
            label: "Group Project",
            value: "project",
            desc: "Collaborate with classmates on projects",
            icon: (
                <svg className="h-5 w-5 text-secondary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m4-4a4 4 0 110-8 4 4 0 010 8zm0 0v4" />
                </svg>
            ),
            onClick: () => toast.error("this is coming soon :)")
        },
        {
            label: "Event Meeting",
            value: "event",
            desc: "Plan or host an event",
            icon: (
                <svg className="h-5 w-5 text-secondary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10m-11 8h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            ),
            onClick: () => toast.error("this is coming soon :)")
        },
        {
            label: "Club Meeting",
            value: "club",
            desc: "Meet with your club",
            icon: (
                <svg className="h-5 w-5 text-secondary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4a2 2 0 002 2h3l4 8h5V3z" />
                </svg>
            ),
            onClick: () => toast.error("this is coming soon :)")
        }
    ]

    const closeMenu = useCallback(() => {
        setOpen(false)
        setFocusIndex(0)
        // Return focus to the button for accessibility
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
        const mq = window.matchMedia('(min-width: 768px)')
        const update = () => setIsDesktop(mq.matches)
        update()
        if (mq.addEventListener) {
            mq.addEventListener('change', update)
            return () => mq.removeEventListener('change', update)
        } else {
            // Safari fallback
            // @ts-ignore
            mq.addListener(update)
            // @ts-ignore
            return () => mq.removeListener(update)
        }
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
                staggerChildren: 0.035,
            },
        },
        exit: { opacity: 0, y: isDesktop ? -6 : 6, scale: 0.98, transition: { duration: 0.12 } },
    }
    const item = {
        hidden: { opacity: 0, y: -2 },
        visible: { opacity: 1, y: 0 }
    }

    return (
        <div className="md:relative md:inline-block md:bottom-0 md:right-0 md:text-left fixed bottom-6 right-6 z-50">
            <motion.button
                ref={buttonRef}
                type="button"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-controls="create-menu"
                onClick={() => setOpen((v) => !v)}
                onKeyDown={onButtonKeyDown}
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
                    aria-hidden="true"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4v16m8-8H4"
                    />
                </svg>
                <span className="md:block hidden">Create Burrow</span>
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
                            // Mobile: open above (go up)
                            "bottom-full mb-2 origin-bottom-right",
                            // Desktop md+: open below (go down)
                            "md:bottom-auto md:mb-0 md:top-full md:mt-2 md:origin-top-right",
                            "border border-primary/20 bg-background shadow-xl ring-1 ring-black/5 focus:outline-none overflow-hidden"
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
                                            className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm md:text-base text-text hover:bg-card transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
                                        >
                                            {opt.icon}
                                            <span className="flex-1 text-left">
                                                <span className="block font-medium">
                                                    {opt.label}
                                                </span>
                                                <span className="block text-xs text-text/40">
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
