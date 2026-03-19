import {Link} from "react-router"

/**
 * Footer
 *
 * @author AJ Kneisl
 */
export default function Footer() {
    return (
        <footer className="border-card-border mt-auto border-t py-6">
            <div
                className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm sm:flex-row">
                <p className="text-text/40">
                    &copy; {new Date().getFullYear()} Burrow &middot; v{import.meta.env.VITE_VERSION}
                </p>

                <nav className="text-text/50 flex flex-wrap justify-center gap-x-6 gap-y-2">
                    <Link to="/ta" className="hover:text-text transition-colors">
                        Become a TA
                    </Link>
                    <Link to="/about" className="hover:text-text transition-colors">
                        About
                    </Link>
                    <Link to="/privacy" className="hover:text-text transition-colors">
                        Privacy
                    </Link>
                    <Link to="/tos" className="hover:text-text transition-colors">
                        Terms
                    </Link>
                    <a
                        href="https://apps.apple.com/us/app/burrow-at-umn/id6757548307"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-text transition-colors"
                    >
                        App Store
                    </a>
                </nav>
            </div>
        </footer>
    )
}
