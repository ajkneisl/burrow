import { useState } from "react"
import {
    DateInput,
    DateRangePicker as RaDateRangePicker,
    DateSegment,
    Group,
    Label,
    Text,
    Button as RaButton,
    FieldError,
    Popover,
    Dialog,
    RangeCalendar,
    CalendarGrid,
    Heading,
    CalendarGridHeader,
    CalendarHeaderCell,
    CalendarGridBody,
    CalendarCell
} from "react-aria-components"
import {
    fromDate,
    toCalendarDate,
    getLocalTimeZone
} from "@internationalized/date"
import clsx from "clsx"

export default function useDateRangePicker() {
    const [firstDate, setFirstDate] = useState<Date | null>(null)
    const [lastDate, setLastDate] = useState<Date | null>(null)

    const tz = getLocalTimeZone()

    return [
        firstDate?.valueOf(),
        lastDate?.valueOf(),
        <RaDateRangePicker
            granularity="day"
            className="rac-date-range"
            {...(firstDate && lastDate
                ? {
                    value: {
                        start: toCalendarDate(fromDate(firstDate, tz)),
                        end: toCalendarDate(fromDate(lastDate, tz))
                    }
                }
                : {})}
            onChange={(range) => {
                // range may be partial while the user is picking
                const start = range?.start ? range.start.toDate(tz) : null
                const end = range?.end ? range.end.toDate(tz) : null

                setFirstDate(start)
                setLastDate(end)
            }}
        >
            <Label className="sr-only">Date range</Label>
            <Group className="bg-hero-50/80 focus-within:border-secondary focus-within:bg-hero-50/60 flex w-full items-center gap-2 rounded-lg border border-neutral-300 px-3 py-3 shadow-inner transition focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:outline-none">
                <DateInput
                    slot="start"
                    className="flex items-center gap-1 text-[15px]"
                >
                    {(segment) => (
                        <DateSegment
                            segment={segment}
                            className={({ isPlaceholder }) =>
                                clsx(
                                    "placeholder:text-text/40",
                                    "px-0.5 tabular-nums text-sm rounded",
                                    isPlaceholder
                                        ? "text-text/50"
                                        : "text-text",
                                    segment.type === "literal"
                                        ? "text-text/60"
                                        : "bg-transparent"
                                )
                            }
                        />
                    )}
                </DateInput>

                <span aria-hidden className="text-text/50">
                    —
                </span>

                <DateInput
                    slot="end"
                    className="flex items-center gap-1 text-[15px]"
                >
                    {(segment) => (
                        <DateSegment
                            segment={segment}
                            className={({ isPlaceholder }) =>
                                clsx(
                                    "placeholder:text-text/40",
                                    "rounded px-0.5 text-sm tabular-nums",
                                    isPlaceholder
                                        ? "text-text/50"
                                        : "text-text",
                                    segment.type === "literal"
                                        ? "text-text/60"
                                        : "bg-transparent"
                                )
                            }
                        />
                    )}
                </DateInput>

                <RaButton
                    slot="trigger"
                    aria-label="Pick a date range"
                    className="hover:bg-hero-50/60 ml-1 inline-flex items-center justify-center rounded-md  bg-transparent focus:ring-2 focus:ring-emerald-500/30 focus:outline-none"
                >
                    {/* caret-down icon */}
                    <svg
                        viewBox="0 0 20 20"
                        className="h-4 w-4"
                        aria-hidden="true"
                        fill="currentColor"
                    >
                        <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.06l3.71-2.83a.75.75 0 1 1 .92 1.18l-4.2 3.2a.75.75 0 0 1-.92 0l-4.2-3.2a.75.75 0 0 1-.02-1.06z" />
                    </svg>
                </RaButton>
            </Group>

            <Text slot="description" className="sr-only" />
            <FieldError className="text-destructive mt-1 text-xs" />

            <Popover className="border-text/10 bg-card z-50 mt-2 w-fit overflow-hidden rounded-xl border p-3 shadow-lg">
                <Dialog className="outline-none">
                    <RangeCalendar>
                        <div className="text-text mb-2 flex items-center justify-between">
                            <RaButton
                                slot="previous"
                                aria-label="Previous month"
                                className="hover:bg-text/10 h-8 w-8 rounded-md"
                            >
                                ‹
                            </RaButton>

                            <Heading className="text-sm font-semibold" />

                            <RaButton
                                slot="next"
                                aria-label="Next month"
                                className="hover:bg-text/10 h-8 w-8 rounded-md"
                            >
                                ›
                            </RaButton>
                        </div>

                        <CalendarGrid className="text-text text-xs">
                            <CalendarGridHeader>
                                {(day) => (
                                    <CalendarHeaderCell className="text-text/60 w-8 py-1 text-center">
                                        {day}
                                    </CalendarHeaderCell>
                                )}
                            </CalendarGridHeader>

                            <CalendarGridBody>
                                {(date) => (
                                    <CalendarCell
                                        date={date}
                                        className={({
                                                        isSelected,
                                                        isDisabled,
                                                        isFocused,
                                                        isSelectionEnd,
                                                        isSelectionStart
                                                    }) =>
                                            clsx(
                                                "relative h-8 w-8 cursor-default text-center leading-8 outline-none select-none",
                                                isDisabled
                                                    ? "text-text/30"
                                                    : "hover:bg-text/10",
                                                isSelected && "bg-secondary/15",
                                                isSelectionStart &&
                                                "rounded-l-md bg-secondary/25",
                                                isSelectionEnd &&
                                                "rounded-r-md bg-secondary/25",
                                                isFocused &&
                                                "ring-2 ring-secondary/50"
                                            )
                                        }
                                    />
                                )}
                            </CalendarGridBody>
                        </CalendarGrid>

                        <Text
                            slot="errorMessage"
                            className="text-destructive mt-2 text-xs"
                        />
                    </RangeCalendar>
                </Dialog>
            </Popover>
        </RaDateRangePicker>
    ]
}
