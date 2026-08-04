import { BurrowResponse } from "@umnburrow/core/api"
import { createContext, useContext } from "react"

export type BurrowContextType = {
    id: string
    data: BurrowResponse
    isOwner: boolean
    isMember: boolean
    isHostOrMod: boolean
    isPast: boolean
    isProject: boolean
    blocks: string[]
    leaveMutation: any
    deleteMutation: any
    setEditModalOpen: (open: boolean) => void
    setFeaturesModalOpen: (open: boolean) => void
    setInviteModalOpen: (open: boolean) => void
    setManageInvitesModalOpen: (open: boolean) => void
}

export const BurrowContext = createContext<BurrowContextType | null>(null)

export function useBurrowContext() {
    const ctx = useContext(BurrowContext)
    if (!ctx)
        throw new Error("useBurrowContext must be used within BurrowLayout")
    return ctx
}
