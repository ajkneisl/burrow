import {useState} from "react"
import {Link} from "react-router"
import {Modal} from "@umnburrow/core"
import useUser from "@features/auth/hooks/useUser.ts"
import {Mail, Clock} from "lucide-react"

/**
 * Footer
 *
 * @author AJ Kneisl
 */
export default function Footer() {
    const user = useUser()
    const [taOpen, setTaOpen] = useState(false)

    return (
        <footer className="border-card-border mt-auto border-t py-6">
            <div
                className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm sm:flex-row">
                <p className="text-text/40">
                    &copy; {new Date().getFullYear()} Burrow &middot; v{import.meta.env.VITE_VERSION}
                </p>

                <nav className="text-text/50 flex flex-wrap justify-center gap-x-6 gap-y-2">
                    {user && (
                        <button
                            onClick={() => setTaOpen(true)}
                            className="hover:text-text cursor-pointer transition-colors"
                        >
                            Become a TA
                        </button>
                    )}

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

            <Modal open={taOpen} onClose={() => setTaOpen(false)} title="Become a TA">
                <p className="text-text/80 leading-relaxed">
                    To apply to be a TA, please send an email from your
                    UMN email to{" "}
                    <a
                        href="mailto:ta@umn.app"
                        className="text-secondary font-semibold hover:underline"
                    >
                        ta@umn.app
                    </a>{" "}
                    with information on which class you're a TA for, and
                    we will get back to you within 48 hours.
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="bg-card flex items-start gap-3 rounded-xl p-4">
                        <Mail size={20} className="text-secondary mt-0.5 flex-shrink-0"/>
                        <div>
                            <p className="text-sm font-medium">Email required</p>
                            <p className="text-text/60 mt-1 text-xs">
                                Must be sent from your @umn.edu address
                            </p>
                        </div>
                    </div>

                    <div className="bg-card flex items-start gap-3 rounded-xl p-4">
                        <Clock size={20} className="text-secondary mt-0.5 flex-shrink-0"/>
                        <div>
                            <p className="text-sm font-medium">Quick approval</p>
                            <p className="text-text/60 mt-1 text-xs">
                                We'll review your request within 48 hours
                            </p>
                        </div>
                    </div>
                </div>
            </Modal>
        </footer>
    )
}