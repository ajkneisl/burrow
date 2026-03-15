import { useState } from "react"
import { View, Pressable } from "react-native"
import { CircleAlert, Flag, ShieldBan } from "lucide-react-native"
import { Modal, Text } from "@components/core"
import ThemedIcon from "@components/core/ThemedIcon"
import { BlockUserModal } from "@features/profile/components/BlockUserModal"
import { ReportUserModal } from "@features/profile/components/ReportUserModal"
import { ReportBurrowModal } from "@features/burrows/components/ReportBurrowModal"

type BurrowMenuModalProps = {
    visible: boolean
    onClose: () => void
    ownerID: string
    ownerDisplayName: string
    burrowID: string
    burrowTitle: string
}

export default function BurrowMenuModal({
    visible,
    onClose,
    ownerID,
    ownerDisplayName,
    burrowID,
    burrowTitle
}: BurrowMenuModalProps) {
    const [showBlockModal, setShowBlockModal] = useState(false)
    const [showReportUserModal, setShowReportUserModal] = useState(false)
    const [showReportBurrowModal, setShowReportBurrowModal] = useState(false)

    return (
        <>
            <Modal
                visible={visible}
                onClose={onClose}
                scrollable={false}
            >
                <View className="pb-2">
                    <Pressable
                        onPress={() => {
                            onClose()
                            setTimeout(
                                () => setShowReportUserModal(true),
                                300
                            )
                        }}
                        className="flex-row items-center gap-4 py-4 active:opacity-70"
                    >
                        <ThemedIcon
                            icon={CircleAlert}
                            size={22}
                            overrideColor="warn"
                        />

                        <Text className="text-text text-base">
                            Report Host
                        </Text>
                    </Pressable>

                    <View className="h-px bg-card-border" />

                    <Pressable
                        onPress={() => {
                            onClose()
                            setTimeout(
                                () => setShowReportBurrowModal(true),
                                300
                            )
                        }}
                        className="flex-row items-center gap-4 py-4 active:opacity-70"
                    >
                        <ThemedIcon
                            icon={Flag}
                            size={22}
                            overrideColor="warn"
                        />
                        <Text className="text-text text-base">
                            Report Burrow
                        </Text>
                    </Pressable>

                    <View className="h-px bg-card-border" />

                    <Pressable
                        onPress={() => {
                            onClose()
                            setTimeout(() => setShowBlockModal(true), 300)
                        }}
                        className="flex-row items-center gap-4 py-4 active:opacity-70"
                    >
                        <ThemedIcon
                            icon={ShieldBan}
                            size={22}
                            overrideColor="error"
                        />
                        <Text className="text-text text-base">
                            Block Author
                        </Text>
                    </Pressable>

                    <View className="h-px bg-card-border mt-2" />

                    <Pressable
                        onPress={onClose}
                        className="py-4 active:opacity-70"
                    >
                        <Text className="text-text text-base text-center font-semibold">
                            Cancel
                        </Text>
                    </Pressable>
                </View>
            </Modal>

            <BlockUserModal
                visible={showBlockModal}
                onClose={() => setShowBlockModal(false)}
                userID={ownerID}
                displayName={ownerDisplayName}
            />

            <ReportUserModal
                visible={showReportUserModal}
                onClose={() => setShowReportUserModal(false)}
                userID={ownerID}
                displayName={ownerDisplayName}
            />

            <ReportBurrowModal
                visible={showReportBurrowModal}
                onClose={() => setShowReportBurrowModal(false)}
                burrowID={burrowID}
                burrowTitle={burrowTitle}
            />
        </>
    )
}
