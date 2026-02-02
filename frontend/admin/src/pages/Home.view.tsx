import { Card } from "@umnburrow/core"
import { Link } from "react-router"

/**
 * Home page of the admin dashboard.
 *
 * @author AJ Kneisl
 */
export default function Home() {
    const quickLinks = [
        { name: "TA Management", path: "/ta" },
        { name: "Report Management", path: "/reports" },
        { name: "Logs", path: "/logs" },
        { name: "Analytics", path: "/analytics" },
        { name: "Badges", path: "/badges" },
        { name: "User Management", path: "/users" },
        { name: "Burrow Management", path: "/burrows" },
    ]

    return (
        <div className="p-6">
            <Card className="p-6">
                <h1 className="text-2xl font-bold mb-4">
                    Welcome to Burrow Admin
                </h1>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {quickLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className="p-4 rounded-lg border hover:bg-muted transition-colors"
                        >
                            {link.name}
                        </Link>
                    ))}
                </div>
            </Card>
        </div>
    )
}