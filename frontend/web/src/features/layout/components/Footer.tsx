import { Link } from "react-router"

/**
 * Footer
 *
 * @author AJ Kneisl
 */
export default function Footer() {
    return (
        <footer className="mt-auto border-t border-card-border py-6">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm sm:flex-row">
                <p className="text-text/40">
                    &copy; {new Date().getFullYear()} Burrow
                </p>

                <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-text/50">
                    <Link
                        to="/articles"
                        className="transition-colors hover:text-text"
                    >
                        Articles
                    </Link>

                    <Link
                        to="/about"
                        className="transition-colors hover:text-text"
                    >
                        About
                    </Link>
                    <Link
                        to="/privacy"
                        className="transition-colors hover:text-text"
                    >
                        Privacy
                    </Link>

                    <Link
                        to="/tos"
                        className="transition-colors hover:text-text"
                    >
                        Terms
                    </Link>

                    <a
                        href="https://apps.apple.com/us/app/burrow-at-umn/id6757548307"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-colors hover:text-text"
                    >
                        App Store
                    </a>
                </nav>
            </div>
        </footer>
    )
}
