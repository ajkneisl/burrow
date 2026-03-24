import React from "react"
import { View, ScrollView } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Button, Text } from "@components/core"
import { AlertTriangle } from "lucide-react-native"

interface ErrorBoundaryProps {
    children: React.ReactNode
    fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
}

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
}

/**
 * Error boundary component to catch and display errors gracefully.
 */
export class ErrorBoundary extends React.Component<
    ErrorBoundaryProps,
    ErrorBoundaryState
> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo)
    }

    resetError = () => {
        this.setState({ hasError: false, error: null })
    }

    render() {
        if (this.state.hasError && this.state.error) {
            if (this.props.fallback) {
                const FallbackComponent = this.props.fallback
                return (
                    <FallbackComponent
                        error={this.state.error}
                        resetError={this.resetError}
                    />
                )
            }

            // Get theme colors (default to light theme for error display)
            const errorColor = "#ef4444" // Tailwind red-500 as fallback

            return (
                <SafeAreaView className="flex-1 bg-background">
                    <ScrollView
                        contentContainerStyle={{ flexGrow: 1 }}
                        className="flex-1 px-6 bg-background"
                    >
                        <View className="flex-1 items-center justify-center">
                            <View className="bg-error bg-opacity-10 rounded-full w-20 h-20 items-center justify-center mb-6">
                                <AlertTriangle size={40} color={errorColor} />
                            </View>

                            <Text className="text-2xl font-bold text-text mb-2">
                                Something went wrong
                            </Text>

                            <Text className="text-text text-opacity-60 text-center mb-6">
                                We encountered an unexpected error. Please try
                                again.
                            </Text>

                            {__DEV__ && (
                                <View className="bg-card rounded-lg p-4 mb-6 w-full">
                                    <Text className="text-xs font-mono text-error mb-2">
                                        {this.state.error.name}
                                    </Text>
                                    <Text className="text-xs font-mono text-text text-opacity-80">
                                        {this.state.error.message}
                                    </Text>
                                    {this.state.error.stack && (
                                        <ScrollView
                                            className="mt-2 max-h-40"
                                            nestedScrollEnabled
                                        >
                                            <Text className="text-xs font-mono text-text text-opacity-60">
                                                {this.state.error.stack}
                                            </Text>
                                        </ScrollView>
                                    )}
                                </View>
                            )}

                            <Button
                                variant="primary"
                                onPress={this.resetError}
                                className="w-full max-w-xs"
                            >
                                Try Again
                            </Button>
                        </View>
                    </ScrollView>
                </SafeAreaView>
            )
        }

        return this.props.children
    }
}
