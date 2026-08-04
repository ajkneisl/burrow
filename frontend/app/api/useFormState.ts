import { post } from "@umnburrow/core/api"
import { useCallback, useState } from "react"

type UseFormStateOptions<T, E> = {
    initial: T
    initialErrors: E
    verifyEndpoint?: string
}

type UseFormStateReturn<T, E> = {
    formState: T
    setFormState: React.Dispatch<React.SetStateAction<T>>
    errors: E
    setErrors: React.Dispatch<React.SetStateAction<E>>
    updateField: <K extends keyof T>(field: K, value: T[K]) => void
    verify: (fields: Record<string, unknown>) => Promise<boolean>
    reset: () => void
}

export default function useFormState<T, E = string[]>({
    initial,
    initialErrors,
    verifyEndpoint
}: UseFormStateOptions<T, E>): UseFormStateReturn<T, E> {
    const [formState, setFormState] = useState<T>(initial)
    const [errors, setErrors] = useState<E>(initialErrors)

    const updateField = useCallback(
        <K extends keyof T>(field: K, value: T[K]) => {
            setFormState((prev) => ({ ...prev, [field]: value }))
        },
        []
    )

    const verify = useCallback(
        async (fields: Record<string, unknown>): Promise<boolean> => {
            if (!verifyEndpoint) return true

            try {
                // scalars go as strings (the verify endpoints coerce them
                // by field type), but arrays must stay arrays — a
                // stringified list silently skips list validation rules
                const normalized = Object.fromEntries(
                    Object.entries(fields).map(([key, value]) => [
                        key,
                        Array.isArray(value) ? value : String(value)
                    ])
                )
                await post(verifyEndpoint, normalized)
                setErrors(initialErrors)
                return true
            } catch (e) {
                if (Array.isArray(e)) {
                    setErrors(e as E)
                } else {
                    setErrors([e as string] as E)
                }
                return false
            }
        },
        [verifyEndpoint, initialErrors]
    )

    const reset = useCallback(() => {
        setFormState(initial)
        setErrors(initialErrors)
    }, [initial, initialErrors])

    return {
        formState,
        setFormState,
        errors,
        setErrors,
        updateField,
        verify,
        reset
    }
}
