import React from "react"
import { View } from "react-native"
import { Text } from "@components/core"
import clsx from "clsx"

interface ViewErrorsProps {
    error?: string | null
    errors?: string[] | null
    className?: string
}

export function ViewErrors({ error, errors, className }: ViewErrorsProps) {
    if (!error && (!errors || errors.length === 0)) {
        return null
    }

    const errorList = error ? [error] : errors || []

    return (
        <View
            className={clsx(
                "bg-error/10 border border-error rounded-lg p-4 mb-4",
                className
            )}
        >
            {errorList.map((err, index) => (
                <View
                    key={index}
                    className="flex-row items-start mb-2 last:mb-0"
                >
                    <Text className="text-error mr-2">•</Text>
                    <Text className="text-error flex-1">{err}</Text>
                </View>
            ))}
        </View>
    )
}
