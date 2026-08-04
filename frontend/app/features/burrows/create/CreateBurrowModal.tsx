import type { BurrowKind } from "@umnburrow/core/api"
import { useState } from "react"
import { useAtom } from "jotai"
import { Modal } from "@components/core"
import { createModalOpen } from "@features/layout/layout.atom"

import { BurrowTypeSelector } from "./BurrowTypeSelector"
import { CreateBurrowWizard } from "./CreateBurrowWizard"

export function CreateBurrowModal() {
    const [isOpen, setIsOpen] = useAtom(createModalOpen)
    const [selectedType, setSelectedType] = useState<BurrowKind | null>(null)

    const handleClose = () => {
        setIsOpen(false)
        setSelectedType(null)
    }

    const handleTypeSelect = (type: BurrowKind) => {
        setSelectedType(type)
    }

    return (
        <Modal
            visible={isOpen}
            onClose={handleClose}
            size="full"
            scrollable={false}
        >
            {!selectedType ? (
                <BurrowTypeSelector
                    onSelect={handleTypeSelect}
                    onClose={handleClose}
                />
            ) : (
                <CreateBurrowWizard
                    onClose={handleClose}
                    burrowKind={selectedType}
                />
            )}
        </Modal>
    )
}
