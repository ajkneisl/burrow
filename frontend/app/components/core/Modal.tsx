import React from "react"
import {
    Modal as RNModal,
    View,
    Text,
    Pressable,
    ScrollView
} from "react-native"
import type { ModalProps as RNModalProps } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { X } from "lucide-react-native"
import clsx from "clsx"

interface ModalProps extends Omit<RNModalProps, "children"> {
    children: React.ReactNode
    title?: string
    onClose?: () => void
    size?: "sm" | "md" | "lg" | "full"
    scrollable?: boolean
}

export function Modal({
    children,
    title,
    onClose,
    size = "md",
    visible,
    scrollable = true,
    ...props
}: ModalProps) {
    const sizeStyles = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        full: "w-full h-full"
    }

    const ModalContainer = size === "full" ? SafeAreaView : View

    return (
        <RNModal
            visible={visible}
            animationType="slide"
            transparent={size !== "full"}
            onRequestClose={onClose}
            {...props}
        >
            <View className="flex-1 justify-end bg-black/50">
                <ModalContainer
                    className={clsx(
                        "bg-background rounded-t-3xl",
                        size === "full"
                            ? "h-full rounded-t-none"
                            : "max-h-[90%]",
                        sizeStyles[size]
                    )}
                >
                    {/* Header */}
                    {(title || onClose) && (
                        <View className="flex-row items-center justify-between px-6 py-4 border-b border-card-border">
                            <Text className="text-xl font-bold text-text flex-1">
                                {title}
                            </Text>
                        </View>
                    )}

                    {/* Body */}
                    {scrollable ? (
                        <ScrollView className="flex-1 px-6 py-4">
                            {children}
                        </ScrollView>
                    ) : size === "full" ? (
                        children
                    ) : (
                        <View className="flex-1 px-6 py-4">{children}</View>
                    )}
                </ModalContainer>
            </View>
        </RNModal>
    )
}

interface ModalHeaderProps {
    children: React.ReactNode
    className?: string
}

export function ModalHeader({ children, className }: ModalHeaderProps) {
    return <View className={clsx("mb-4", className)}>{children}</View>
}

interface ModalBodyProps {
    children: React.ReactNode
    className?: string
}

export function ModalBody({ children, className }: ModalBodyProps) {
    return <View className={clsx("flex-1", className)}>{children}</View>
}

interface ModalFooterProps {
    children: React.ReactNode
    className?: string
}

export function ModalFooter({ children, className }: ModalFooterProps) {
    return (
        <View
            className={clsx(
                "flex-row justify-end gap-3 mt-6 pt-4 border-t border-card-border",
                className
            )}
        >
            {children}
        </View>
    )
}
