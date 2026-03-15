import { Pressable } from "react-native"
import { Text } from "@components/core"
import { Plus } from "lucide-react-native"
import { useAtom } from "jotai"
import { createModalOpen } from "../layout.atom"
import { useThemeColors } from "@api/theme/useThemeColors"

export function CreateFab() {
    const [, setCreateOpen] = useAtom(createModalOpen)
    const colors = useThemeColors()

    return (
        <Pressable
            onPress={() => setCreateOpen(true)}
            className="absolute bottom-6 right-6 bg-secondary rounded-full w-16 h-16 items-center justify-center shadow-lg active:opacity-80"
            style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 4.65,
                elevation: 8
            }}
        >
            <Plus size={28} color={colors.primary} strokeWidth={3} />
        </Pressable>
    )
}
