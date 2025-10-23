import React from "react"
import {View, Text, ScrollView, Pressable, TextInput, RefreshControl} from "react-native"
import {QueryClient, QueryClientProvider, useQuery} from "@tanstack/react-query"
import {GroupMeetingResponse} from "@/features/meetings/api/meetings.types";
import {fetchGroups} from "@/features/meetings/api/meetings.api";

import "./global.css"

const MAROON = "#7A0019"
const GOLD = "#FFCC33"

const queryClient = new QueryClient()
export default function Index() {
    return (
        <QueryClientProvider client={queryClient}>
            <HomeScreen/>
        </QueryClientProvider>
    )
}

function HomeScreen() {
    const {
        data: groups = [],
        isLoading,
        isError,
        error,
        refetch,
        isRefetching
    } = useQuery<GroupMeetingResponse[], Error>({
        queryKey: ["groups"],
        queryFn: fetchGroups,
        staleTime: 60_000,
    })

    return (
        <View className="flex-1 bg-white dark:bg-neutral-900">
            <ScrollView
                className="flex-1"
                contentContainerStyle={{paddingBottom: 96}}
                refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch}/>}
            >
                <Header/>
                <Hero/>
                <SectionTitle label="Upcoming study groups"/>
                <View className="px-4 gap-3">
                    {isLoading ? (
                        <LoadingList/>
                    ) : isError ? (
                        <ErrorState message={error?.message ?? "Failed to load groups"} onRetry={refetch}/>
                    ) : groups.length === 0 ? (
                        <EmptyState/>
                    ) : (
                        groups.map((group) => <GroupCard key={group.meeting.id} {...group} />)
                    )}
                </View>
            </ScrollView>
            <CreateFab/>
        </View>
    )
}

function Header() {
    return (
        <View className="pt-12 pb-4 px-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
                <View className="h-8 w-8 rounded-lg items-center justify-center" style={{backgroundColor: MAROON}}>
                    <Text className="font-bold" style={{color: GOLD}}>B</Text>
                </View>
                <Text className="text-2xl font-extrabold text-black dark:text-white">Burrow</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Open settings"
                       className="px-3 py-2 rounded-lg active:opacity-80" style={{backgroundColor: "#f6f6f6"}}>
                <Text className="text-black">⚙️</Text>
            </Pressable>
        </View>
    )
}

function Hero() {
    return (
        <View className="px-4">
            <View className="rounded-2xl p-4 overflow-hidden" style={{backgroundColor: MAROON}}>
                <Text className="text-white/90 text-xs tracking-wide">University of Minnesota</Text>
                <Text className="text-white text-2xl font-extrabold mt-1">Find your study crew</Text>
                <Text className="text-white/80 mt-1">Create or join groups, plan sessions, and collaborate
                    faster.</Text>

                <View className="mt-4 bg-white/95 rounded-xl px-3 py-2 flex-row items-center">
                    <Text className="text-black/50 mr-2">🔎</Text>
                    <TextInput
                        placeholder="Search courses, topics, buildings…"
                        placeholderTextColor="#6b7280"
                        className="flex-1 text-black"
                    />
                </View>

                <View className="mt-3 flex-row gap-2">
                    <Chip label="CSCI"/>
                    <Chip label="Calc"/>
                    <Chip label="Exam prep"/>
                </View>

                <View className="absolute -right-8 -bottom-8 h-40 w-40 rounded-full opacity-20"
                      style={{backgroundColor: GOLD}}/>
            </View>
        </View>
    )
}

function Chip({label}: { label: string }) {
    return (
        <View className="px-3 py-1 rounded-full bg-white/10 border border-white/20">
            <Text className="text-white text-xs">{label}</Text>
        </View>
    )
}

function SectionTitle({label}: { label: string }) {
    return (
        <View className="px-4 mt-6 mb-2">
            <Text className="text-black dark:text-white text-base font-semibold">{label}</Text>
        </View>
    )
}

function GroupCard(group: GroupMeetingResponse) {
    return (
        <Pressable
            className="rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 active:opacity-95">
            <Text className="text-black dark:text-white font-semibold text-base">{group.meeting.title}</Text>
            <View className="mt-2 gap-1.5">
                <Row icon="🗓" text={formatWhen(group.meeting.beginningTime, group.meeting.endTime)}/>
                <Row icon="📍" text={group.meeting.location}/>
                <Row icon="👥" text={`${group.meeting.joined} members`}/>
            </View>
            <View className="mt-3 flex-row gap-2">
                <Pressable className="px-3 py-2 rounded-lg" style={{backgroundColor: MAROON}}>
                    <Text className="text-white font-medium">Join</Text>
                </Pressable>
                <Pressable className="px-3 py-2 rounded-lg border" style={{borderColor: MAROON}}>
                    <Text className="font-medium" style={{color: MAROON}}>Details</Text>
                </Pressable>
            </View>
        </Pressable>
    )
}

function Row({icon, text}: { icon: string; text: string }) {
    return (
        <View className="flex-row items-center gap-2">
            <Text className="text-base" accessibilityElementsHidden>{icon}</Text>
            <Text className="text-neutral-700 dark:text-neutral-300">{text}</Text>
        </View>
    )
}

function CreateFab() {
    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create a study group"
            className="absolute right-5 bottom-5 rounded-full px-5 py-4 shadow-lg"
            style={{backgroundColor: GOLD}}
        >
            <Text className="font-extrabold" style={{color: MAROON}}>＋ Create</Text>
        </Pressable>
    )
}

function LoadingList() {
    return (
        <View className="gap-3">
            {Array.from({length: 3}).map((_, i) => (
                <View key={i}
                      className="rounded-2xl p-4 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                    <View className="h-4 w-2/3 rounded mb-3" style={{backgroundColor: "#e5e7eb"}}/>
                    <View className="h-3 w-1/2 rounded mb-2" style={{backgroundColor: "#eef0f3"}}/>
                    <View className="h-3 w-1/3 rounded" style={{backgroundColor: "#eef0f3"}}/>
                </View>
            ))}
        </View>
    )
}

function ErrorState({message, onRetry}: { message: string; onRetry: () => void }) {
    return (
        <View className="rounded-2xl p-4 border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <Text className="text-red-800 dark:text-red-300 font-medium">{message}</Text>
            <Pressable onPress={onRetry} className="mt-3 self-start px-3 py-2 rounded-lg"
                       style={{backgroundColor: GOLD}}>
                <Text className="font-semibold" style={{color: MAROON}}>Retry</Text>
            </Pressable>
        </View>
    )
}

function EmptyState() {
    return (
        <View
            className="rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <Text className="text-black dark:text-white font-semibold mb-1">No groups yet</Text>
            <Text className="text-neutral-600 dark:text-neutral-400">Be the first to create a study group for your
                course.</Text>
        </View>
    )
}

function formatWhen(beginMs: number, endMs: number): string {
    const b = new Date(beginMs)
    const e = new Date(endMs)
    const sameDay = b.toDateString() === e.toDateString()
    const dayFmt = new Intl.DateTimeFormat(undefined, {weekday: "short"})
    const timeFmt = new Intl.DateTimeFormat(undefined, {hour: "numeric", minute: "2-digit"})

    const dayPart = dayFmt.format(b)
    const timePart = `${timeFmt.format(b)}–${timeFmt.format(e)}`

    const today = new Date()
    const isToday = b.toDateString() === today.toDateString()
    const isTomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toDateString() === b.toDateString()

    if (isToday) return `Today · ${timePart}`
    if (isTomorrow) return `Tomorrow · ${timePart}`
    return sameDay ? `${dayPart} · ${timePart}` : `${dayPart} · ${timePart}`
}
