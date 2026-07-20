import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

/**
 * Remove react-markdown's `node` prop so it isn't spread onto DOM elements.
 */
function clean<T extends { node?: unknown }>(props: T): Omit<T, "node"> {
    const rest = { ...props }
    delete rest.node
    return rest
}

/**
 * Renders an article's markdown content with Burrow styling.
 *
 * @param content The markdown content to render.
 */
export default function ArticleContent({ content }: { content: string }) {
    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                h1: (props) => (
                    <h1
                        className="text-text mt-10 mb-4 text-3xl font-bold first:mt-0 sm:text-4xl"
                        {...clean(props)}
                    />
                ),
                h2: (props) => (
                    <h2
                        className="text-text mt-8 mb-3 text-2xl font-bold first:mt-0"
                        {...clean(props)}
                    />
                ),
                h3: (props) => (
                    <h3
                        className="text-text mt-6 mb-2 text-xl font-semibold first:mt-0"
                        {...clean(props)}
                    />
                ),
                h4: (props) => (
                    <h4
                        className="text-text mt-4 mb-2 text-lg font-semibold first:mt-0"
                        {...clean(props)}
                    />
                ),
                p: (props) => (
                    <p
                        className="text-text/80 mb-4 leading-relaxed"
                        {...clean(props)}
                    />
                ),
                a: (props) => (
                    <a
                        className="text-secondary font-medium hover:underline"
                        target={
                            props.href?.startsWith("/") ? undefined : "_blank"
                        }
                        rel="noopener noreferrer"
                        {...clean(props)}
                    />
                ),
                ul: (props) => (
                    <ul
                        className="text-text/80 mb-4 list-disc space-y-1 pl-6"
                        {...clean(props)}
                    />
                ),
                ol: (props) => (
                    <ol
                        className="text-text/80 mb-4 list-decimal space-y-1 pl-6"
                        {...clean(props)}
                    />
                ),
                li: (props) => (
                    <li className="leading-relaxed" {...clean(props)} />
                ),
                blockquote: (props) => (
                    <blockquote
                        className="border-secondary/40 text-text/70 mb-4 border-l-4 pl-4 italic"
                        {...clean(props)}
                    />
                ),
                code: (props) => (
                    <code
                        className="bg-card border-card-border rounded border px-1.5 py-0.5 font-mono text-sm"
                        {...clean(props)}
                    />
                ),
                pre: (props) => (
                    <pre
                        className="bg-card border-card-border mb-4 overflow-x-auto rounded-xl border p-4 text-sm [&>code]:border-0 [&>code]:bg-transparent [&>code]:p-0"
                        {...clean(props)}
                    />
                ),
                hr: () => <hr className="border-card-border my-8" />,
                table: (props) => (
                    <div className="mb-4 overflow-x-auto">
                        <table
                            className="border-card-border w-full border-collapse border text-left text-sm"
                            {...clean(props)}
                        />
                    </div>
                ),
                th: (props) => (
                    <th
                        className="border-card-border bg-card text-text border px-3 py-2 font-semibold"
                        {...clean(props)}
                    />
                ),
                td: (props) => (
                    <td
                        className="border-card-border text-text/80 border px-3 py-2"
                        {...clean(props)}
                    />
                ),
                img: (props) => (
                    <img
                        className="border-card-border mb-4 max-w-full rounded-xl border"
                        loading="lazy"
                        {...clean(props)}
                    />
                ),
                strong: (props) => (
                    <strong className="text-text font-semibold" {...clean(props)} />
                )
            }}
        >
            {content}
        </ReactMarkdown>
    )
}
