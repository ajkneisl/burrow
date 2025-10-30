export type NavItem = {
    label: string
    href?: string
    color?: string
    current?: boolean
}

export type NavSection = {
    title: string
    items: NavItem[]
}