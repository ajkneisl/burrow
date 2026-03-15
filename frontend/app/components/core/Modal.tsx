import React from "react"
import { Modal as RNModal, View, Pressable, ScrollView } from "react-native"
import { Text } from "@components/core"
import type { ModalProps as RNModalProps } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { X } from "lucide-react-native"
import clsx from "clsx"
import { Button } from "@components/core/Button"
import ThemedIcon from "@components/core/ThemedIcon"

/**
 * {@link Modal}
 */
interface ModalProps extends Omit<RNModalProps, "children"> {
    children: React.ReactNode
    title?: string
    onClose?: () => void
    size?: "sm" | "md" | "lg" | "full"
    scrollable?: boolean
    centered?: boolean
}

/**
 * A Modal.
 *
 * @param children Contents of the modal.
 * @param title The title of the modal.
 * @param onClose When the modal closes.
 * @param size The size of the modal.
 * @param visible If currently visible.
 * @param scrollable If the contents are scrollable.
 * @param centered If the modal is centered.
 * @param props {@link RNModalProps}
 *
 * @author AJ Kneisl
 */
export function Modal({
    children,
    title,
    onClose,
    size = "md",
    visible,
    scrollable = true,
    centered = false,
    ...props
}: ModalProps) {
    const insets = useSafeAreaInsets()

    const sizeStyles = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        full: "w-full h-full"
    }

    const containerClassName = clsx(
        "bg-background w-full",
        centered ? "rounded-3xl" : "rounded-t-3xl",
        size === "full" ? "h-full rounded-none" : "",
        centered && sizeStyles[size]
    )

    const modalContent = (
        <>
            {/* Header */}
            {title && (
                <View className="flex-row items-center justify-between px-6 py-4 border-b border-card-border">
                    <Text className="text-xl font-bold text-text flex-1">
                        {title}
                    </Text>

                    <Button variant="ghost" onPress={onClose}>
                        <ThemedIcon icon={X} size={24} />
                    </Button>
                </View>
            )}

            {/* Body */}
            {scrollable ? (
                <ScrollView
                    className={clsx("px-6 py-4", !centered && "flex-1")}
                    showsVerticalScrollIndicator={false}
                >
                    {children}
                </ScrollView>
            ) : size === "full" ? (
                children
            ) : (
                <View className="px-6 py-4">{children}</View>
            )}
        </>
    )

    if (!visible) return null

    return (
        <RNModal
            visible={visible}
            animationType="slide"
            transparent
            statusBarTranslucent
            onRequestClose={onClose}
            {...props}
        >
            <Pressable
                className={clsx(
                    "flex-1 bg-black/50",
                    centered
                        ? "justify-center items-center px-6"
                        : "justify-end"
                )}
                onPress={onClose}
            >
                <Pressable className={size === "full" ? "flex-1" : undefined} onPress={(e) => e.stopPropagation()}>
                    {size === "full" ? (
                        <View
                            style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
                            className={clsx(containerClassName, "flex-1")}
                        >
                            {modalContent}
                        </View>
                    ) : (
                        <View
                            style={{ paddingBottom: insets.bottom }}
                            className={containerClassName}
                        >
                            {modalContent}
                        </View>
                    )}
                </Pressable>
            </Pressable>
        </RNModal>
    )
}
