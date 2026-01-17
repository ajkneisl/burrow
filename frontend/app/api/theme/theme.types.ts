import {vars} from "nativewind";

/**
 * The different types of themes.
 */
export type Theme = "DARK" | "LIGHT" | "AUTO" | "EARTH"

/**
 * Type for theme color palette.
 */
export interface ThemeColors {
    background: string
    primary: string
    secondary: string
    card: string
    cardBorder: string
    hero: string
    text: string
    success: string
    info: string
    warn: string
    error: string
    primaryHover: string
    secondaryHover: string
    successHover: string
    infoHover: string
    warnHover: string
    errorHover: string
}

/**
 * The theme colors.
 */
export const themeColors: { light: ThemeColors; dark: ThemeColors } = {
    light: {
        background: "#ffffff",
        primary: "#7a0019",
        secondary: "#ffcc00",
        card: "#f9fafb",
        cardBorder: "#e5e7eb",
        hero: "#dedbd5",
        text: "#212121",
        success: "#008000",
        info: "#0066cc",
        warn: "#ffcc00",
        error: "#bf1e2e",
        primaryHover: "#a02828",
        secondaryHover: "#e6b400",
        successHover: "#009646",
        infoHover: "#1e82e6",
        warnHover: "#ffd246",
        errorHover: "#d23c3c"
    },
    dark: {
        background: "#1a1a1a",
        primary: "#87343f",
        secondary: "#ffcc00",
        card: "#2a2a2a",
        cardBorder: "#1a1c1e",
        hero: "#1f2023",
        text: "#f3f4f6",
        success: "#48bb78",
        info: "#64b5f6",
        warn: "#ffd700",
        error: "#ef5350",
        primaryHover: "#a02828",
        secondaryHover: "#e6b400",
        successHover: "#5ac88c",
        infoHover: "#78c8ff",
        warnHover: "#ffe15a",
        errorHover: "#fa6e6e"
    }
}


/**
 * The theme variables
 */
export const themeVars = {
    light: vars({
        "--color-background": themeColors.light.background,
        "--color-primary": themeColors.light.primary,
        "--color-secondary": themeColors.light.secondary,
        "--color-card": themeColors.light.card,
        "--color-card-border": themeColors.light.cardBorder,
        "--color-hero": themeColors.light.hero,
        "--color-text": themeColors.light.text,
        "--color-success": themeColors.light.success,
        "--color-info": themeColors.light.info,
        "--color-warn": themeColors.light.warn,
        "--color-error": themeColors.light.error,
        "--color-primary-hover": themeColors.light.primaryHover,
        "--color-secondary-hover": themeColors.light.secondaryHover,
        "--color-success-hover": themeColors.light.successHover,
        "--color-info-hover": themeColors.light.infoHover,
        "--color-warn-hover": themeColors.light.warnHover,
        "--color-error-hover": themeColors.light.errorHover
    }),
    dark: vars({
        "--color-background": themeColors.dark.background,
        "--color-primary": themeColors.dark.primary,
        "--color-secondary": themeColors.dark.secondary,
        "--color-card": themeColors.dark.card,
        "--color-card-border": themeColors.dark.cardBorder,
        "--color-hero": themeColors.dark.hero,
        "--color-text": themeColors.dark.text,
        "--color-success": themeColors.dark.success,
        "--color-info": themeColors.dark.info,
        "--color-warn": themeColors.dark.warn,
        "--color-error": themeColors.dark.error,
        "--color-primary-hover": themeColors.dark.primaryHover,
        "--color-secondary-hover": themeColors.dark.secondaryHover,
        "--color-success-hover": themeColors.dark.successHover,
        "--color-info-hover": themeColors.dark.infoHover,
        "--color-warn-hover": themeColors.dark.warnHover,
        "--color-error-hover": themeColors.dark.errorHover
    })
}