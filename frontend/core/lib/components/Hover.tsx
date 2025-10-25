import {PropsWithChildren, ReactNode} from "react";

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
    return (
        <div className="relative inline-block group">
            {children}

            <div
                className="pointer-events-none absolute -top-1.5 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-background px-2 py-1 text-xs text-base-100 opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100"
                role="tooltip"
            >
                {content}
            </div>
        </div>
    )
}