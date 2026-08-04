import { saveTheme } from "@umnburrow/core/api"
import type { Theme } from "@umnburrow/core/api"
import { useAtom, useSetAtom } from "jotai"
import { themeAtom } from "@api/theme/theme.atom.ts"
import { Card } from "@umnburrow/core"
import { Sun, Moon, Monitor, Leaf } from "lucide-react"
import type {FormEvent} from "react"
;
import {settingsSaveLoading} from "@features/settings/settings.atom.ts"
;

type ThemeOption = {
    value: Theme
    label: string
    icon: React.ReactNode
    colors: {
        bg: string
        card: string
        primary: string
        secondary: string
        text: string
    }
}

const THEME_OPTIONS: ThemeOption[] = [
    {
        value: "AUTO",
        label: "Auto",
        icon: <Monitor className="size-5" />,
        colors: {
            bg: "linear-gradient(135deg, #ffffff 50%, #1a1a1a 50%)",
            card: "#f9fafb",
            primary: "#7A0019",
            secondary: "#FFCC00",
            text: "#212121"
        }
    },
    {
        value: "LIGHT",
        label: "Light",
        icon: <Sun className="size-5" />,
        colors: {
            bg: "#ffffff",
            card: "#f9fafb",
            primary: "#7A0019",
            secondary: "#FFCC00",
            text: "#212121"
        }
    },
    {
        value: "DARK",
        label: "Dark",
        icon: <Moon className="size-5" />,
        colors: {
            bg: "#1a1a1a",
            card: "#2a2a2a",
            primary: "#4E000A",
            secondary: "#FFCC00",
            text: "#F3F4F6"
        }
    },
    {
        value: "EARTH",
        label: "Earth",
        icon: <Leaf className="size-5" />,
        colors: {
            bg: "#faf6f1",
            card: "#f5ede3",
            primary: "#8B4513",
            secondary: "#D2691E",
            text: "#3d3029"
        }
    }
]

/**
 * Settings involving the theme.
 */
export default function ThemeSection() {
    const [theme, setTheme] = useAtom(themeAtom)
    const setLoading = useSetAtom(settingsSaveLoading)

    function selectTheme(newTheme: Theme) {
        setTheme(newTheme)
        saveTheme(newTheme).catch(() => {})
    }

    async function onSubmit(ev: FormEvent) {
        ev.preventDefault()
        setLoading(false)
    }

    return (
        <Card className="flex flex-col gap-6">
            <div>
                <h3 className="text-lg font-semibold text-text">Appearance</h3>
                <p className="text-sm text-text/60">
                    Choose how Burrow looks to you
                </p>
            </div>

            <form
                id="theme-form"
                onSubmit={onSubmit}
                className="grid grid-cols-1 gap-4 md:grid-cols-2"
            >
                {THEME_OPTIONS.map((option) => {
                    const isSelected = theme === option.value

                    return (
                        <button
                            type="button"
                            key={option.value}
                            onClick={() => selectTheme(option.value)}
                            className={`group relative flex flex-col overflow-hidden rounded-xl border-2 transition-all ${
                                isSelected
                                    ? "border-secondary ring-4 ring-secondary/20"
                                    : "border-card-border hover:border-secondary/50"
                            }`}
                        >
                            {/* Color preview */}
                            <div
                                className="relative h-20 w-full"
                                style={{ background: option.colors.bg }}
                            >
                                {/* Mini card preview */}
                                <div
                                    className="absolute inset-x-3 top-3 h-10 rounded-md shadow-sm"
                                    style={{
                                        backgroundColor: option.colors.card,
                                        border: `1px solid ${option.colors.text}20`
                                    }}
                                >
                                    <div className="flex items-center gap-2 p-2">
                                        <div
                                            className="size-3 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    option.colors.primary
                                            }}
                                        />
                                        <div
                                            className="h-2 flex-1 rounded"
                                            style={{
                                                backgroundColor: `${option.colors.text}30`
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Accent dots */}
                                <div className="absolute bottom-2 left-3 flex gap-1.5">
                                    <div
                                        className="size-2 rounded-full"
                                        style={{
                                            backgroundColor:
                                                option.colors.secondary
                                        }}
                                    />
                                    <div
                                        className="size-2 rounded-full"
                                        style={{
                                            backgroundColor:
                                                option.colors.primary
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Label area */}
                            <div className="flex items-center justify-center gap-2 bg-card p-3">
                                <span
                                    className={`${isSelected ? "text-secondary" : "text-text/60"}`}
                                >
                                    {option.icon}
                                </span>
                                <span
                                    className={`text-sm font-medium ${isSelected ? "text-secondary" : "text-text"}`}
                                >
                                    {option.label}
                                </span>
                            </div>

                            {/* Selected checkmark */}
                            {isSelected && (
                                <div className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-secondary">
                                    <svg
                                        className="size-3 text-white"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={3}
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                </div>
                            )}
                        </button>
                    )
                })}
            </form>
        </Card>
    )
}
