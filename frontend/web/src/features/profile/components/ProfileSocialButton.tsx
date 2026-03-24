export default function ProfileSocialButton({
    icon,
    label,
    href
}: {
    icon: React.ReactNode
    label: string
    href: string
}) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-card border-card-border hover:bg-card/80 flex flex-1 items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition"
        >
            {icon}
            <span>{label}</span>
        </a>
    )
}
