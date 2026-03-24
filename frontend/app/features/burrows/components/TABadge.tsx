import { GraduationCap } from "lucide-react-native"
import { Chip } from "@components/core"

/**
 * A badge that indicates a TA.
 *
 * @author AJ Kneisl
 */
export default function TABadge() {
    return (
        <Chip color="info" icon={GraduationCap}>
            TA
        </Chip>
    )
}
