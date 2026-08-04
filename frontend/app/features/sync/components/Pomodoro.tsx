import { msToClock } from "@umnburrow/core/api"
import type { BurrowRole } from "@umnburrow/core/api"
import { View, Pressable } from "react-native"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Svg, { Circle } from "react-native-svg"
import { Play, Pause, RotateCcw, RefreshCw } from "lucide-react-native"
import { Button, Card, Text } from "@components/core"

import { usePomodoroSync } from "@features/sync/hooks/usePomodoroSync"

import { useThemeColors } from "@api/theme/useThemeColors"

type PomodoroProps = {
    burrowId?: string
    userRole: BurrowRole
}

/**
 * Pomodoro timer component with real-time sync.
 * Displays a circular progress timer with controls for moderators/hosts.
 */
export function Pomodoro({ burrowId, userRole }: PomodoroProps) {
    const colors = useThemeColors()
    const { state, send } = usePomodoroSync(burrowId)

    const [now, setNow] = useState<number>(() => Date.now())
    const tickRef = useRef<number | null>(null)

    // Maintain local countdown
    useEffect(() => {
        // Run only while active
        if (!state.isActive || state.startedAt === 0) {
            if (tickRef.current) cancelAnimationFrame(tickRef.current)
            return
        }

        let raf: number
        const loop = () => {
            setNow(Date.now())
            raf = requestAnimationFrame(loop)
        }

        raf = requestAnimationFrame(loop)
        tickRef.current = raf

        return () => cancelAnimationFrame(raf)
    }, [state.isActive, state.startedAt])

    // Compute optimistic remaining based on last server snapshot
    const optimisticRemaining = useMemo(() => {
        if (!state.isActive || state.startedAt === 0) return state.durationMs

        const elapsed = Math.max(0, now - state.startedAt)
        return Math.max(0, state.durationMs - elapsed)
    }, [state.isActive, state.startedAt, state.durationMs, now])

    const phaseLabel = state.isBreak ? "Break" : "Work"
    const totalMs = state.remainingMs || 1
    const progress = 100 - Math.floor((optimisticRemaining / totalMs) * 100)

    // Circle calculations
    const radius = 100
    const strokeWidth = 12
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference * (1 - progress / 100)

    // Actions
    const togglePhase = () => send("CHANGE_PHASE")
    const startTimer = () => send("START_TIMER")
    const endTimer = () => send("END_TIMER")
    const resetTimer = () => send("RESET_TIMER")
    const resync = useCallback(() => send("RETRIEVE_TIMER"), [send])

    // Sync on load
    useEffect(() => {
        resync()
    }, [resync])

    const isModeratorOrHost = userRole === "HOST" || userRole === "MODERATOR"

    const phaseColor = state.isBreak ? colors.info : colors.secondary
    const phaseColorBg = state.isBreak
        ? `${colors.info}1A`
        : `${colors.secondary}1A`

    return (
        <Card variant="bordered">
            <View className="items-center py-4">
                {/* Phase Indicator */}
                <View className="flex-row items-center gap-3 mb-6">
                    <View
                        className="rounded-full border-2 px-4 py-2"
                        style={{
                            backgroundColor: phaseColorBg,
                            borderColor: phaseColor
                        }}
                    >
                        <Text
                            className="text-sm font-semibold"
                            style={{ color: phaseColor }}
                        >
                            {phaseLabel} Phase
                        </Text>
                    </View>

                    <Pressable
                        onPress={resync}
                        className="p-2 rounded-full active:bg-card"
                    >
                        <RefreshCw size={16} color={colors.text} style={{ opacity: 0.6 }} />
                    </Pressable>
                </View>

                {/* Circular Timer Display */}
                <View className="mb-6 items-center justify-center relative">
                    <Svg width={240} height={240} viewBox="0 0 240 240">
                        {/* Background Circle */}
                        <Circle
                            cx="120"
                            cy="120"
                            r={radius}
                            stroke={colors.cardBorder}
                            strokeWidth={strokeWidth}
                            fill="none"
                        />

                        {/* Progress Circle */}
                        <Circle
                            cx="120"
                            cy="120"
                            r={radius}
                            stroke={phaseColor}
                            strokeWidth={strokeWidth}
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            transform={`rotate(-90 120 120)`}
                        />
                    </Svg>

                    {/* Timer Text Centered */}
                    <View className="absolute inset-0 items-center justify-center">
                        <Text className="text-text text-4xl font-bold">
                            {msToClock(optimisticRemaining)}
                        </Text>

                        <View className="flex-row items-center gap-2 mt-3">
                            <View
                                className={`w-2 h-2 rounded-full ${state.isActive ? "bg-success" : "bg-text"}`}
                                style={{ opacity: state.isActive ? 1 : 0.3 }}
                            />
                            <Text className="text-text text-opacity-60 text-sm font-medium">
                                {state.isActive ? "Active" : "Paused"}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Status Text */}
                <Text className="text-text text-opacity-50 text-sm mb-6">
                    {state.isActive
                        ? `Started at ${new Date(state.startedAt).toLocaleTimeString()}`
                        : "Timer is stopped"}
                </Text>

                {/* Control Buttons (Moderators/Host Only) */}
                {isModeratorOrHost && (
                    <View className="w-full gap-3">
                        {/* Primary Action */}
                        <Button
                            variant={state.isActive ? "outline" : "success"}
                            size="lg"
                            fullWidth
                            onPress={() =>
                                state.isActive ? endTimer() : startTimer()
                            }
                            leftIcon={
                                state.isActive ? (
                                    <Pause size={20} color={colors.text} />
                                ) : (
                                    <Play size={20} color="#FFFFFF" />
                                )
                            }
                        >
                            {state.isActive ? "Pause Timer" : "Start Timer"}
                        </Button>

                        {/* Secondary Actions */}
                        <View className="flex-row gap-2">
                            <Button
                                variant="outline"
                                size="md"
                                onPress={togglePhase}
                                disabled={state.isActive}
                                className="flex-1"
                            >
                                Switch to {state.isBreak ? "Work" : "Break"}
                            </Button>

                            <Button
                                variant="outline"
                                size="md"
                                onPress={resetTimer}
                                disabled={state.isActive}
                                leftIcon={
                                    <RotateCcw size={16} color={colors.error} />
                                }
                            >
                                Reset
                            </Button>
                        </View>
                    </View>
                )}

                {/* Member View (No Controls) */}
                {!isModeratorOrHost && (
                    <View className="w-full bg-info/10 rounded-lg p-3">
                        <Text className="text-text text-opacity-80 text-xs text-center">
                            Timer is controlled by Burrow moderators.
                        </Text>
                    </View>
                )}
            </View>
        </Card>
    )
}
