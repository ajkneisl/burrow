import { Link } from "react-router"

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

                    <div className="mt-2 flex flex-row justify-center text-s">
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
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                        className="h-4 w-4"
                                    >
                                        <path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11.25 20h-2.5v-9h2.5v9zm-1.25-10.3c-.83 0-1.5-.68-1.5-1.5 0-.83.67-1.5 1.5-1.5.82 0 1.5.67 1.5 1.5 0 .82-.68 1.5-1.5 1.5zm12.25 10.3h-2.5v-4.5c0-1.07-.02-2.44-1.5-2.44-1.5 0-1.73 1.17-1.73 2.37v4.57h-2.5v-9h2.4v1.23h.03c.33-.63 1.14-1.3 2.35-1.3 2.52 0 2.98 1.66 2.98 3.83v5.24z" />
                                    </svg>
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
