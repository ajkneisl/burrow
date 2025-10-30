import {PropsWithChildren, ReactNode, useState, useCallback, useMemo, useEffect, useRef} from "react";

/**
 * {@see Hover}
 */
type HoverProps = {
    content: ReactNode
} & PropsWithChildren

/**
 * A hover component.
 *
 * @param content The content that invokes the hover.
 * @param children The content to view on hover.
 * @constructor
 */
export default function Hover({content, children}: HoverProps) {
    const isTouchLike = useMemo(() => {
        if (typeof window === "undefined" || !("matchMedia" in window)) return false
        let supportsHover = false
        let coarse = false
        try { supportsHover = window.matchMedia("(hover: hover)").matches } catch {}
        try { coarse = window.matchMedia("(pointer: coarse)").matches } catch {}
        return !supportsHover && coarse
    }, [])

    const [open, setOpen] = useState(false)
    const toggle = useCallback(() => setOpen((o) => !o), [])
    const rootRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (!isTouchLike || !open) return

        const handler = (e: Event) => {
            if (!rootRef.current) return
            const target = e.target as Node | null
            if (target && !rootRef.current.contains(target)) {
                setOpen(false)
            }
        }

        document.addEventListener("pointerdown", handler, true)
        document.addEventListener("click", handler, true)

        return () => {
            document.removeEventListener("pointerdown", handler, true)
            document.removeEventListener("click", handler, true)
        }
    }, [isTouchLike, open])

    return (
        <div
            ref={rootRef}
            className="relative inline-block group"
            onClick={isTouchLike ? toggle : undefined}
        >
            {children}
            <div
                className={
                    isTouchLike
                        ? `cursor-pointer absolute -top-1.5 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-background px-2 py-1 text-xs text-base-100 shadow-md transition-opacity duration-150 ${
                            open ? "opacity-100" : "opacity-0 pointer-events-none"
                        }`
                        : "pointer-events-none absolute -top-1.5 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-background px-2 py-1 text-xs text-base-100 opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100"
                }
                role="tooltip"
            >
                {content}
            </div>
        </div>
    )
}