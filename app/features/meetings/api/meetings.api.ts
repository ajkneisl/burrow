import {GroupMeetingResponse} from "@/features/meetings/api/meetings.types";

export async function fetchGroups(): Promise<GroupMeetingResponse[]> {
    const res = await fetch("https://umn.app/api/groups", {
        method: "GET",
        headers: {
            Authorization: "Bearer eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMDI1NjgzODM4ODE3OTcxMzM1NzEiLCJpc3MiOiJhamtuIiwiYXVkIjoiYWprbiIsImV4cCI6MTc1OTg5ODE0OH0.DedBt6-k3Z5KIzjg4U2UQdkjXaEwBk-LH4NgTnbJRaf4bdG9QuYIdnxNHPN0m3_kL1EGZw9whcvuMM_Py2ftYQ",
            Accept: "application/json"
        },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
}