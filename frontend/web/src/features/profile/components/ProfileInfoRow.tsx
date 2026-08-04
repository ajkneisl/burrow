export default function ProfileInfoRow({
    icon,
    label,
    value
}: {
    icon: React.ReactNode
    label: string
    value: React.ReactNode
}) {
    return (
        <div className="flex items-center gap-3">
            <div className="mt-0.5 text-secondary">{icon}</div>

            <div>
                <span className="text-xs text-text/50">{label}</span>
                <div className="text-sm text-text">{value}</div>
            </div>
        </div>
    )
}
