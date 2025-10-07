import Input, { type InputProps } from "@components/Input.tsx"

/**
 * Props for {@link LabelledInput}.
 *
 * @param text The text for the label.
 * @param remark An optional remark below the input.
 */
type LabelledInputProps = {
    text: string
    remark?: string
} & InputProps

/**
 * A labeled input.
 *
 * @param props {@link LabelledInputProps}
 */
export default function LabelledInput(props: LabelledInputProps) {
    return (
        <div>
            <label
                htmlFor="name"
                className="block text-sm font-medium mb-1 figree"
            >
                {props.text}
            </label>

            <Input {...props} />

            {props.remark && (
                <p className="mt-2 text-xs text-text/80">{props.remark}</p>
            )}
        </div>
    )
}
