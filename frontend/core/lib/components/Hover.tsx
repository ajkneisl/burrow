import { type PropsWithChildren, type ReactNode, useMemo } from "react"
import {
    TooltipTrigger,
    Tooltip as AriaTooltip,
    Button
} from "react-aria-components"

/**
 * {@see Hover}
 */
type HoverProps = {
    content: ReactNode
} & PropsWithChildren

/**
 * A hover/tooltip component with react-aria for accessibility.
 * Automatically adapts between hover (desktop) and press (touch) interactions.
 * Handles ESC key and focus management automatically.
 *
 * @param content The tooltip content to show on hover/press.
 * @param children The trigger element that invokes the tooltip.
 *
 * @author AJ Kneisl
 */
export default function Hover({ content, children }: HoverProps) {
    // Detect if device is touch-like (mobile/tablet)
    const isTouchLike = useMemo(() => {
        if (typeof window === "undefined" || !("matchMedia" in window))
            return false
        let supportsHover = false
        let coarse = false
        try {
            supportsHover = window.matchMedia("(hover: hover)").matches
        } catch {}
        try {
            coarse = window.matchMedia("(pointer: coarse)").matches
        } catch {}
        return !supportsHover && coarse
    }, [])

    return (
        <TooltipTrigger
            delay={200}
            closeDelay={0}
            trigger={isTouchLike ? "focus" : undefined}
        >
            <Button className="inline-block cursor-pointer outline-none">
                {children}
            </Button>

            <AriaTooltip
                offset={6}
                placement="top"
                className="absolute z-50 whitespace-nowrap rounded-md bg-background px-2 py-1 text-xs text-text/70 shadow-md outline-none animate-in fade-in duration-150"
            >
                {content}
            </AriaTooltip>
        </TooltipTrigger>
    )
}