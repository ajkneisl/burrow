import { Link } from "react-router"
import { Linkedin } from "lucide-react"

const linkedIn: { name: string; link: string }[] = [
    {
        name: "AJ Kneisl",
        link: "/in/ajkn"
    },
    {
        name: "Yordanos Eshete",
        link: "/in/yordanoseshete"
    },
    {
        name: "Thien-Tri Nguyen",
        link: "/in/thientri-nguyen"
    },
    {
        name: "Benjamin Stortroen",
        link: "/in/benjamin-stortroen-b61400347/"
    },
    {
        name: "Josh Westerlund",
        link: "/in/joshua-westerlund-b29199362/"
    }
]

/**
 * Footer :)
 */
export default function Footer() {
    return (
        <footer className="bg-background text-text/80 mt-auto outline px-4 py-8 text-sm">
            <div className="mx-auto grid max-w-7xl grid-cols-1 text-center sm:grid-cols-2 sm:text-left lg:grid-cols-4">
                <div>
                    <h4 className="text-secondary mb-2 font-semibold">
                        Burrow
                    </h4>

                    <p className="text-sm">
                        Connecting University of Minnesota students through
                        study groups and collaboration.
                    </p>

                    <div className="mt-2 flex flex-row justify-center text-xs">
                        <Link
                            to="/privacy"
                            className="hover:text-text/60 align:cn text-s underline"
                        >
                            Privacy Policy
                        </Link>
                        <span className="text-text/60 mx-2">•</span>
                        <Link
                            to="/tos"
                            className="hover:text-text/60 hover:underline text-s underline"
                        >
                            Terms of Service
                        </Link>
                        <span className="text-text/60 mx-2">•</span>
                        <Link
                            to="/about"
                            className="hover:text-text/60 hover:underline text-s underline "
                        >
                            About & FAQ
                        </Link>
                    </div>
                </div>

                <div className="col-span-2">
                    <h4 className="text-secondary mb-2 font-semibold">
                        Contributors
                    </h4>

                    <ul className="flex flex-row flex-wrap items-center justify-center gap-2 space-y-2">
                        {linkedIn.map(({ name, link }) => (
                            <li>
                                <a
                                    href={`https://www.linkedin.com${link}`}
                                    target="_blank"
                                    className="border-info text-info hover:bg-info-hover/20 inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition"
                                    rel="noopener noreferrer"
                                >
                                    <Linkedin className="h-4 w-4" />
                                    {name}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="text-text/70">
                    <p>
                        © {new Date().getFullYear()} Burrow (v
                        {import.meta.env.VITE_VERSION})
                    </p>
                    <p>Not affiliated with the University of Minnesota.</p>
                </div>
            </div>
        </footer>
    )
}
