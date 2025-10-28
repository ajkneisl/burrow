import { useCallback, useState } from "react"
import { Button, Modal, Toggle } from "@umnburrow/core"
import { type Blocks } from "@features/sync/api/sync.types.ts"
import { blockStatus } from "@features/sync/api/sync.atom.ts"
import { useAtom } from "jotai"
import { saveBlocks } from "@features/sync/api/blocks.api.ts"
import useToken from "@features/auth/api/hooks/useToken.ts"
import { useParams } from "react-router"

/**
 * {@see MeetingFeatures}
 */
type MeetingFeaturesProps = {
    inPast: boolean
}

/**
 * Manage the enabled blocks in a meeting
 */
export function MeetingFeatures({ inPast }: MeetingFeaturesProps) {
    const { id } = useParams()
    const auth = useToken()

    const [blocks, setBlocks] = useAtom(blockStatus)
    const [open, setOpen] = useState(false)

    const isEnabled = useCallback(
        (name: Blocks) => blocks.includes(name),
        [blocks]
    )

    // toggle enable a key
    function toggle(key: Blocks) {
        if (isEnabled(key)) {
            setBlocks((prev) => prev.filter((blockName) => blockName !== key))
        } else {
            setBlocks((prev) => [...prev, key])
        }
    }

    // save state
    async function save() {
        if (!auth || !id) return

        await saveBlocks(auth, id, blocks)

        setOpen(false)
    }

    return (
        <>
            <Button
                color={"PRIMARY"}
                onClick={() => setOpen(true)}
                disabled={inPast}
            >
                <span>Meeting Features</span>
            </Button>

            <Modal
                open={open}
                onClose={() => setOpen(false)}
                title="Meeting Features"
                footer={
                    <>
                        <Button color="ERROR" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>

                        <Button color="SUCCESS" onClick={save}>
                            Save
                        </Button>
                    </>
                }
            >
                <div className="divide-y divide-base-300">
                    <Toggle
                        title="Meeting Chat"
                        description="A live chat for meeting members."
                        checked={isEnabled("CHAT")}
                        onChange={() => toggle("CHAT")}
                    />

                    <Toggle
                        title="Pomodoro"
                        description="A synced timer for enhanced studying."
                        checked={isEnabled("POMODORO")}
                        onChange={() => toggle("POMODORO")}
                    />
                </div>
            </Modal>
        </>
    )
}
