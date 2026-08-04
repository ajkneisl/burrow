import { BurrowKind } from "@umnburrow/core/api"
import { BURROW_KIND_CONFIG } from "@features/burrows/burrows.types"
import { useThemeColors } from "@api/theme/useThemeColors"
import { View } from "react-native"
import { Chip, Text } from "@components/core"
import ThemedIcon from "@components/core/ThemedIcon"
import { MapPin } from "lucide-react-native"
import {ChipColor} from "@components/core/Chip"
;

/**
 * {@link KindChip}
 */
type KindChipProps = {
    kind: BurrowKind
}

/**
 * The stylized kind chip.
 *
 * @param kind The Burrow kind.
 *
 * @author AJ Kneisl
 */
export default function KindChip({ kind }: KindChipProps) {
    const kindConfig = BURROW_KIND_CONFIG[kind] || BURROW_KIND_CONFIG.STUDY

    return (
        <Chip color={kindConfig.colorKey} icon={kindConfig.Icon}>
            {kindConfig.label}
        </Chip>
    )
}
