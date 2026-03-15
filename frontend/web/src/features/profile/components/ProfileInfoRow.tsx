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
            <div className="text-secondary mt-0.5">{icon}</div>

            <div>
                <span className="text-text/50 text-xs">{label}</span>
                <div className="text-text text-sm">{value}</div>
            </div>
        </div>
    )
}
