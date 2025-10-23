import {GroupMeetingResponse} from "@/features/meetings/api/meetings.types";

export async function fetchGroups(): Promise<GroupMeetingResponse[]> {
    const res = await fetch("http://localhost:8080/api/groups", {
        method: "GET",
        headers: {
            Authorization: "Bearer eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMDI1NjgzODM4ODE3OTcxMzM1NzEiLCJpc3MiOiJhamtuIiwiYXVkIjoiYWprbiIsImV4cCI6MTc2MDAyMzc1N30.PRl1eWQoGYhvw7L1338R3RAzxpTf_p2Lx_ksv5DqdZN4zzRI8jJw3wkuEHl5_PX6mcf963RcusZ7OLAu79qOjw",
            Accept: "application/json"
        },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
}