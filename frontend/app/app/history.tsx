import { useMemo, useState, useCallback } from "react"
import { View, Text, SectionList, RefreshControl, Pressable } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Calendar, RotateCcw } from "lucide-react-native"
import { useRouter } from "expo-router"
import { getUserHistory } from "@features/burrows/burrows.api"
import { UpcomingBurrowCard } from "@features/home/components/UpcomingBurrowCard"
import { Header } from "@features/layout/components"
import { humanDateLabel } from "@api/util"
import type { BurrowResponse } from "@features/burrows/burrows.types"
import { Modal } from "@components/core"
import { CreateBurrowWizard } from "@features/burrows/create/CreateBurrowWizard"
import type { SubmittedBurrowFormState } from "@features/burrows/create/create.types"
import { useThemeColors } from "@api/theme/useThemeColors"

/**
 * View user's burrow history (React Native).
 */
export default function HistoryScreen() {
    const router = useRouter()
    const colors = useThemeColors()
    const [currentPage] = useState(1)
    const [recreateModalOpen, setRecreateModalOpen] = useState(false)
    const [selectedBurrow, setSelectedBurrow] = useState<BurrowResponse | null>(
        null
    )

    const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
        queryKey: ["history", currentPage],
        queryFn: async () => await getUserHistory(currentPage),
        refetchOnWindowFocus: false
    })

    const allBurrows: BurrowResponse[] = useMemo(
        () => data?.contents ?? [],
        [data]
    )

    // Group burrows by their date
    const groupedByDate = useMemo(() => {
        const map = new Map<string, BurrowResponse[]>()

        allBurrows.forEach((burrow) => {
            const burrowDate = new Date(burrow.burrow.endTime)
            const key = burrowDate.toISOString().slice(0, 10)
            const list = map.get(key) ?? []

            list.push(burrow)
            map.set(key, list)
        })

        // Sort entries (newest first)
        const entries = Array.from(map.entries()).sort(([a], [b]) => {
            const aMs = new Date(a).getTime()
            const bMs = new Date(b).getTime()
            return bMs - aMs
        })

        return entries.map(([key, data]) => ({
            title: humanDateLabel(key),
            data
        }))
    }, [allBurrows])

    // Convert burrow to form data for recreation
    const getFormDataFromBurrow = useCallback(
        (
            burrowResponse: BurrowResponse
        ): Partial<SubmittedBurrowFormState> | undefined => {
            const burrow = burrowResponse.burrow

            if (burrow.kind === "PROJECT") {
                return undefined // Projects can't be recreated
            }

            // For recreation, use tomorrow as the default date
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 1)
            tomorrow.setHours(12, 0, 0, 0)

            const beginDateTime = new Date(tomorrow)
            const endDateTime = new Date(tomorrow)
            endDateTime.setHours(14, 0, 0, 0)

            return {
                kind: burrow.kind,
                title: burrow.title,
                description: burrow.description,
                location: burrow.location,
                date: tomorrow,
                beginningTime: beginDateTime,
                endTime: endDateTime,
                tags: burrow.tags?.join(", ") || "",
                capacity: burrow.capacity || 0,
                visibility: burrow.visibility,
                requestToJoin: burrow.requestToJoin
            }
        },
        []
    )

    const handleRecreate = useCallback((burrowResponse: BurrowResponse) => {
        setSelectedBurrow(burrowResponse)
        setRecreateModalOpen(true)
    }, [])

    const renderSectionHeader = ({
        section
    }: {
        section: { title: string }
    }) => (
        <View className="flex-row items-center gap-3 mb-4 mt-6 first:mt-0">
            <Text className="text-base font-semibold text-text">
                {section.title}
            </Text>
            <View className="flex-1 h-px bg-card-border" />
        </View>
    )

    const renderItem = ({ item }: { item: BurrowResponse }) => {
        const burrow = item.burrow
        const isPast = burrow.endTime < Date.now()
        const canRecreate = isPast && burrow.kind !== "PROJECT"

        return (
            <UpcomingBurrowCard
                burrowResponse={item}
                verbose
                actionBadge={
                    canRecreate ? (
                        <Pressable
                            onPress={() => handleRecreate(item)}
                            className="rounded-full px-3 py-1.5 flex-row items-center gap-1.5 active:opacity-70"
                            style={{
                                backgroundColor: `${colors.secondary}1A`,
                                borderWidth: 1,
                                borderColor: colors.secondary
                            }}
                        >
                            <RotateCcw size={12} color={colors.secondary} />
                            <Text
                                className="text-xs font-bold"
                                style={{ color: colors.secondary }}
                            >
                                Recreate
                            </Text>
                        </Pressable>
                    ) : undefined
                }
            />
        )
    }

    const renderEmpty = () => (
        <View className="items-center justify-center py-12">
            <Calendar size={48} color={colors.text} style={{ opacity: 0.2 }} />
            <Text className="text-text text-opacity-60 text-lg mt-4">No history yet</Text>
            <Text className="text-text text-opacity-40 text-sm mt-1">
                Join some Burrows to see them here
            </Text>
        </View>
    )

    const renderLoading = () => (
        <View className="px-6 gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
                <View
                    key={i}
                    className="bg-card border border-card-border rounded-xl p-4"
                >
                    <View className="flex-row items-start justify-between gap-4">
                        <View className="flex-1 gap-2">
                            <View className="bg-text/10 h-5 w-48 rounded" />
                            <View className="bg-text/10 h-3 w-32 rounded" />
                            <View className="mt-2 gap-1.5">
                                <View className="bg-text/10 h-3 w-full rounded" />
                                <View className="bg-text/10 h-3 w-3/4 rounded" />
                            </View>
                        </View>
                        <View className="bg-text/10 h-10 w-10 rounded-full" />
                    </View>
                </View>
            ))}
        </View>
    )

    if (isError) {
        return (
            <SafeAreaView className="flex-1 bg-background">
                <Header
                    title="History"
                    showSearch={false}
                    leftAction={
                        <Pressable onPress={() => router.back()} className="p-2 -ml-2">
                            <ArrowLeft size={24} color={colors.text} />
                        </Pressable>
                    }
                />
                <View className="flex-1 items-center justify-center px-6">
                    <Text className="text-error text-base font-medium">
                        Failed to load history
                    </Text>
                    <Text className="text-text text-opacity-60 text-sm mt-2">
                        {String(error)}
                    </Text>
                </View>
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView className="flex-1 bg-background">
            <Header
                title="History"
                showSearch={false}
                leftAction={
                    <Pressable onPress={() => router.back()} className="p-2 -ml-2">
                        <ArrowLeft size={24} color={colors.text} />
                    </Pressable>
                }
            />

            <View className="px-6 pt-4 pb-2">
                <Text className="text-text text-opacity-60 text-sm">
                    View your current and past Burrows
                </Text>
            </View>

            {isLoading ? (
                renderLoading()
            ) : groupedByDate.length === 0 ? (
                renderEmpty()
            ) : (
                <SectionList
                    sections={groupedByDate}
                    keyExtractor={(item) => item.burrow.id}
                    renderItem={renderItem}
                    renderSectionHeader={renderSectionHeader}
                    contentContainerStyle={{
                        paddingHorizontal: 24,
                        paddingBottom: 24
                    }}
                    refreshControl={
                        <RefreshControl
                            refreshing={isFetching && !isLoading}
                            onRefresh={refetch}
                            tintColor="#7A0019"
                        />
                    }
                />
            )}

            {/* Recreation Modal */}
            <Modal
                visible={recreateModalOpen}
                onClose={() => {
                    setRecreateModalOpen(false)
                    setSelectedBurrow(null)
                }}
                size="full"
            >
                {selectedBurrow && (
                    <CreateBurrowWizard
                        onClose={() => {
                            setRecreateModalOpen(false)
                            setSelectedBurrow(null)
                        }}
                        burrowKind={selectedBurrow.burrow.kind}
                        mode="create"
                        initialData={getFormDataFromBurrow(selectedBurrow)}
                    />
                )}
            </Modal>
        </SafeAreaView>
    )
}
